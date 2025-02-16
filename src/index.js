import axios from 'axios'
import Koa from 'koa'
import Router from 'koa-router'
import constant from './constant.js'
import cmdConstant from './cmd_constant.js'
import * as https from "node:https"
import cmdList from './cmd_list.js'
import LogContext from './log.js'

async function processCommand(raw, extend) {
    const cmds = raw.split(' ')
    if (cmds.length >= 1) {
        const configs = JSON.parse((await extend.axiosControlPlane.post(constant.PLUGIN_CONFIG_URL, {
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
        if (cmds[0] in cmdList) {
            return await cmdList[cmds[0]](configs, cmds, axiosPVE)
        } else {
            return cmdConstant.RESULT_NO_SUCH_CMD
        }
    } else {
        return cmdConstant.RESULT_PARAMS_ERROR
    }
}

async function sendRequest(pluginName, target, data, extend) {
    return await extend.axiosControlPlane.post(constant.PLUGIN_URL, {
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
    const logCtx = new LogContext(axiosControlPlane, pluginName)

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
            const extend = {
                axiosControlPlane,
                logCtx
            }
            extend[constant.PLUGIN_NAME] = pluginName
            processCommand(raw, extend).then(data => {
                sendRequest(pluginName, name, data, extend).then(res => {
                    console.log(res)
                }).catch(err => {
                    console.log(err)
                })
            }).catch(err => {
                console.log(err)
                sendRequest(pluginName, name, err.message, extend).then(res => {
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
