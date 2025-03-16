import cmdConstant from './cmd_constant.js'
import fs from 'fs'

const session = {

}

let currentSession = ''

function processCmds(cmds) {
    if (cmds.length < 1) {
        return cmds
    }
    if (currentSession === '' || !(currentSession in session)) {
        return cmds
    }
    const currentConfig = session[currentSession]
    const resultArr = []
    resultArr.push(cmds[0])
    if (cmds.length > 2) {
        resultArr.push(cmds[1])
    } else {
        if ('pve' in currentConfig) {
            resultArr.push(currentConfig['pve'])
        }
    }
    if (cmds.length > 3) {
        resultArr.push(cmds[2])
    } else {
        if ('node' in currentConfig) {
            resultArr.push(currentConfig['node'])
        }
    }
    if (cmds.length > 4) {
        resultArr.push(cmds[3])
    } else {
        if ('vmid' in currentConfig) {
            resultArr.push(currentConfig['vmid'])
        }
    }
    return resultArr
}

export default {
    'help': async function (configs, cmds, axiosPVE) {
        return await new Promise((resolve, reject) => {
            fs.readFile('src/help', 'utf8', (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    },
    'createSession': async function (configs, cmds, axiosPVE) {
        if (cmds.length >= 2) {
            session[cmds[1]] = {}
        }
        if (cmds.length >= 3) {
            session[cmds[1]]['pve'] = cmds[2]
        }
        if (cmds.length >= 4) {
            session[cmds[1]]['node'] = cmds[3]
        }
        if (cmds.length >= 5) {
            session[cmds[1]]['vmid'] = cmds[4]
        }
        return cmdConstant.RESULT_SUCCESS
    },
    'removeSession': async function (configs, cmds, axiosPVE) {
        if (cmds.length > 2) {
            if (cmds[1] in session) {
                delete session[cmds[1]]
            }
            return cmdConstant.RESULT_SUCCESS
        }
        return cmdConstant.RESULT_PARAMS_ERROR
    },
    'listSession': async function (configs, cmds, axiosPVE) {
        let sessionList = '会话列表:'
        for (const key in session) {
            sessionList = sessionList + '\n' + `key: '${key}', session: '${JSON.stringify(session[key])}'`
        }
        return sessionList
    },
    'useSession': async function (configs, cmds, axiosPVE) {
        if (cmds.length < 2) {
            currentSession = ''
            return cmdConstant.RESULT_SUCCESS
        }
        if (cmds[1] in session) {
            currentSession = cmds[1]
        } else {
            currentSession = ''
        }
        return cmdConstant.RESULT_SUCCESS
    },
    'getCurrentSession': async function (configs, cmds, axiosPVE) {
        return `Current Session is ${currentSession}`
    },
    'getPVEList': async function (configs, cmds, axiosPVE) {
        let machineList = '集群列表:'
        for (const i in configs) {
            machineList = machineList + '\n' + `第${Number(i) + 1}个集群: ${configs[i].name}`
        }
        return machineList
    },
    'getNodes': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    },
    'getNodeInfo': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
        if (cmds.length < 3) {
            return cmdConstant.RESULT_PARAMS_ERROR
        }
        if (!axiosPVE.hasOwnProperty(cmds[1])) {
            return cmdConstant.RESULT_NO_SUCH_PVE
        }
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
    },
    'getVMs': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    },
    'getVMInfo': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    },
    'startVM': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    },
    'shutdownVM': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    },
    'suspendVM': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    },
    'resumeVM': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    },
    'stopVM': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    },
    'rebootVM': async function (configs, cmds, axiosPVE) {
        cmds = processCmds(cmds)
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
    }
}