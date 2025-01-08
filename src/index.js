import axios from 'axios'
import Koa from 'koa'
import Router from 'koa-router'
import constant from './constant.js'
import cmdConstant from './cmd_constant.js'
import fs from 'fs'
import * as https from "node:https"

async function processCommand(axiosControlPlane, raw, extend) {
    const cmds = raw.split(' ')
    if (cmds.length >= 1) {
        const method = cmds[0]
        if (method === 'help') {
            return await new Promise((resolve, reject) => {
                fs.readFile('src/help', 'utf8', (err, data) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(data)
                    }
                })
            })
        }
        const configs = JSON.parse((await axiosControlPlane.post(constant.PLUGIN_CONFIG_URL, {
            name: extend[constant.PLUGIN_NAME],
            config_key: 'hosts'
        })).data.data.config_value)
        const axiosPVE = {}
        for (const i in configs) {
            const config = configs[i]
            axiosPVE[config.name] = axios.create({
                baseURL: `${config.address}${constant.PVE_API_PREFIX}`,
                headers: {
                    Authorization: constant.AUTHORIZATION_VALUE(config.user, config.token)
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            })
        }
        switch (method) {
            case 'getPVEList':
                let machineList = '集群列表:'
                for (const i in configs) {
                    machineList = machineList + '\n' + `第${Number(i) + 1}个集群: ${configs[i].name}`
                }
                return machineList
            case 'getNodes':
                if (cmds.length < 2) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const nodesData = (await axiosPVE[cmds[1]].get('/nodes')).data.data
                let nodeListInfo= `集群${cmds[1]}下节点:\n`
                for (const i in nodesData) {
                    nodeListInfo = nodeListInfo + '\n' + `第${Number(i) + 1}个节点: ${nodesData[i].node}`
                }
                return nodeListInfo
            case 'getNodeInfo':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                /*
                nodesData = (await axiosPVE[cmds[1]].get('/nodes')).data.data
                for (const i in nodesData) {
                    const nodeData = nodesData[i]
                    if (nodeData.node === cmds[2]) {
                        return `集群${cmds[1]}节点${cmds[2]}信息:\n`
                            + `节点名: ${nodeData.node}\n`
                            + `CPU核心数: ${nodeData.maxcpu}\n`
                            + `CPU使用率: ${(nodeData.cpu * 100).toFixed(2)}%\n`
                            + `内存容量: ${(nodeData.maxmem / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                            + `已用内存: ${(nodeData.mem / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                            + `local磁盘大小: ${(nodeData.maxdisk / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                            + `local磁盘已用: ${(nodeData.disk / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                            + `节点状态: ${nodeData.status}\n`
                            + `已开机时间: ${(nodeData.uptime / 60 / 60 / 24).toFixed(2)}天`
                    }
                }
                */
                const nodeInfo = (await axiosPVE[cmds[1]].get(`/nodes/${cmds[2]}/status`)).data.data
                if (nodeInfo) {
                    return `集群${cmds[1]}节点${cmds[2]}信息:\n`
                        + `CPU: ${nodeInfo.cpuinfo.model} ${nodeInfo.cpuinfo.cores}核${nodeInfo.cpuinfo.cpus}线程 ${(nodeInfo.cpuinfo.mhz / 1024).toFixed(2)}GHz\n`
                        + `内存: 总共${(nodeInfo.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB 已用${(nodeInfo.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB 可用${(nodeInfo.memory.free / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                        + `交换分区: 总共${(nodeInfo.swap.total / 1024 / 1024 / 1024).toFixed(2)}GB 已用${(nodeInfo.swap.used / 1024 / 1024 / 1024).toFixed(2)}GB 可用${(nodeInfo.swap.free / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                        + `local磁盘: 总共${(nodeInfo.rootfs.total / 1024 / 1024 / 1024).toFixed(2)}GB 已用${(nodeInfo.rootfs.used / 1024 / 1024 / 1024).toFixed(2)}GB 可用${(nodeInfo.rootfs.avail / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                        + `系统版本: ${nodeInfo.pveversion}\n`
                        + `内核版本: ${nodeInfo["current-kernel"].sysname} ${nodeInfo["current-kernel"].release} ${nodeInfo["current-kernel"].machine} ${nodeInfo["current-kernel"].version}\n`
                        + `已开机时间: ${(nodeInfo.uptime / 60 / 60 / 24).toFixed(2)}天`
                }
                return cmdConstant.RESULT_NO_SUCH_NODE
            case 'getVMs':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const vmList = (await axiosPVE[cmds[1]].get(`/nodes/${cmds[2]}/qemu`)).data.data
                let vmListInfo = `集群${cmds[1]}节点${cmds[2]}下虚拟机:\n`
                for (const i in vmList) {
                    const vm = vmList[i]
                    vmListInfo = vmListInfo + `第${Number(i) + 1}台虚拟机: \n  名字: ${vm.name} \n  ID: ${vm.vmid}\n`
                }
                return vmListInfo
            case 'getVMInfo':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const vmStatus = (await axiosPVE[cmds[1]].get(`/nodes/${cmds[2]}/qemu/${cmds[3]}/status/current`)).data.data
                let vmInfo = `集群${cmds[1]}节点${cmds[2]}下的虚拟机${vmStatus.name}信息:\n`
                    + `虚拟机名称: ${vmStatus.name} (${vmStatus.vmid})\n`
                    + `CPU: ${vmStatus.cpus}核\n`
                    + `内存: ${(vmStatus.maxmem / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                    + `硬盘: ${(vmStatus.maxdisk / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                    + `状态: ${vmStatus.qmpstatus}`
                if (vmStatus.qmpstatus === 'running') {
                    vmInfo = vmInfo + '\n'
                        + `CPU使用率: ${(vmStatus.cpu * 100).toFixed(2)}%\n`
                        + `已用内存: ${(vmStatus.mem / 1024 / 1024 / 1024).toFixed(2)}GB 可用内存: ${(vmStatus.freemem / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                        + `开机后磁盘已读: ${(vmStatus.diskread / 1024 / 1024 / 1024).toFixed(2)}GB 已写: ${(vmStatus.diskwrite / 1024 / 1024 / 1024).toFixed(2)}GB\n`
                        + `已开机时间: ${(vmStatus.uptime / 60 / 60 / 24).toFixed(2)}天`
                }
                return vmInfo
            case 'startVM':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const startResult = (await axiosPVE[cmds[1]].post(`/nodes/${cmds[2]}/qemu/${cmds[3]}/status/start`)).data.data
                if (startResult) {
                    return cmdConstant.RESULT_SUCCESS
                } else {
                    return cmdConstant.RESULT_UNKNOWN
                }
            case 'shutdownVM':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const shutdownResult = (await axiosPVE[cmds[1]].post(`/nodes/${cmds[2]}/qemu/${cmds[3]}/status/shutdown`)).data.data
                if (shutdownResult) {
                    return cmdConstant.RESULT_SUCCESS
                } else {
                    return cmdConstant.RESULT_UNKNOWN
                }
            case 'suspendVM':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const suspendResult = (await axiosPVE[cmds[1]].post(`/nodes/${cmds[2]}/qemu/${cmds[3]}/status/suspend`)).data.data
                if (suspendResult) {
                    return cmdConstant.RESULT_SUCCESS
                } else {
                    return cmdConstant.RESULT_UNKNOWN
                }
            case 'resumeVM':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const resumeResult = (await axiosPVE[cmds[1]].post(`/nodes/${cmds[2]}/qemu/${cmds[3]}/status/resume`)).data.data
                if (resumeResult) {
                    return cmdConstant.RESULT_SUCCESS
                } else {
                    return cmdConstant.RESULT_UNKNOWN
                }
            case 'stopVM':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const stopResult = (await axiosPVE[cmds[1]].post(`/nodes/${cmds[2]}/qemu/${cmds[3]}/status/stop`)).data.data
                if (stopResult) {
                    return cmdConstant.RESULT_SUCCESS
                } else {
                    return cmdConstant.RESULT_UNKNOWN
                }
            case 'rebootVM':
                if (cmds.length < 3) {
                    return cmdConstant.RESULT_PARAMS_ERROR
                }
                if (!axiosPVE.hasOwnProperty(cmds[1])) {
                    return cmdConstant.RESULT_NO_SUCH_PVE
                }
                const rebootResult = (await axiosPVE[cmds[1]].post(`/nodes/${cmds[2]}/qemu/${cmds[3]}/status/reboot`)).data.data
                if (rebootResult) {
                    return cmdConstant.RESULT_SUCCESS
                } else {
                    return cmdConstant.RESULT_UNKNOWN
                }
            default:
                return cmdConstant.RESULT_NO_SUCH_CMD
        }
    } else {
        return cmdConstant.RESULT_PARAMS_ERROR
    }
}

async function sendRequest(axiosControlPlane, pluginName, target, data) {
    return await axiosControlPlane.post(constant.PLUGIN_URL, {
        name: pluginName,
        target: target,
        data: data
    })
}

function main() {
    const host = process.env.HOST
    const port = process.env.PORT
    const prefix = process.env.PREFIX || ''
    const username = process.env.USERNAME
    const token = process.env.TOKEN
    const pluginName = process.env.PLUGIN_NAME

    const axiosControlPlane = axios.create({
        baseURL: constant.CONTROL_PLANE_BASE_REQUEST_URL(host, port, prefix),
        headers: {
            token, username
        }
    })

    const app = new Koa()
    const router = new Router()
    router.post(constant.PLUGIN_URL, ctx => {
        let _token = ctx.request.headers.token
        ctx.req.on(constant.EVENT_DATA, data => {
            let params = JSON.parse(data)
            let name = params[constant.PARAMS_NAME]
            let target = params[constant.PARAMS_TARGET]
            let raw = params[constant.PARAMS_DATA]
            if (target !== pluginName) {
                return ctx.response.body = JSON.stringify({
                    code: constant.ERROR_CODE_NOT_THIS_PLUGIN,
                    message: constant.ERROR_MESSAGE_NOT_THS_PLUGIN
                })
            }
            if (_token !== token) {
                return ctx.response.body = JSON.stringify({
                    code: constant.ERROR_CODE_TOKEN_INVALID,
                    message: constant.ERROR_MESSAGE_TOKEN_INVALID
                })
            }
            const extend = {}
            extend[constant.PLUGIN_NAME] = pluginName
            processCommand(axiosControlPlane, raw, extend).then(data => {
                sendRequest(axiosControlPlane, pluginName, name, data).then(res => {
                    console.log(res)
                }).catch(err => {
                    console.log(err)
                })
            }).catch(err => {
                console.log(err)
                sendRequest(axiosControlPlane, pluginName, name, err.message).then(res => {
                    console.log(res)
                }).catch(err => {
                    console.log(err)
                })
            })
            ctx.response.body = JSON.stringify({
                code: constant.ERROR_CODE_SUCCESS,
                message: constant.ERROR_MESSAGE_SUCCESS
            })
        })
    })
    app.use(router.routes()).use(router.allowedMethods())
    app.listen(80)
}

main()
