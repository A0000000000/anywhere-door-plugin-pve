import cmdConstant from './cmd_constant.js'
import fs from 'fs'

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
    'getPVEList': async function (configs, cmds, axiosPVE) {
        let machineList = '集群列表:'
        for (const i in configs) {
            machineList = machineList + '\n' + `第${Number(i) + 1}个集群: ${configs[i].name}`
        }
        return machineList
    },
    'getNodes': async function (configs, cmds, axiosPVE) {
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
    },
    'getVMs': async function (configs, cmds, axiosPVE) {
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