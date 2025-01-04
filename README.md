# anywhere-door-plugin-pve
AnywhereDoor Plugin PVE实现

## 环境变量
* HOST: 控制平面地址
* PORT: 控制平面端口
* PREFIX: 控制平面前缀
* USERNAME: plugin所属用户名称
* TOKEN: plugin令牌
* PLUGIN_NAME: plugin名称

## 打包方式
1. 将代码clone下来
2. 安装docker及buildx
3. 打包镜像
    * `docker buildx build --platform linux/amd64 -t 192.168.25.5:31100/maoyanluo/anywhere-door-plugin-pve:1.0 . --load`

## 部署方式

### Docker Command Line
1. 运行容器

### Kubernetes
```yaml

```

1. 保证容器正常运行
2. 注册plugin: POST AnywhereDoorManager/plugin/create & Header: token: token & Body: { "plugin_name": "name", "plugin_describe": "desc", "plugin_host": "anywhere-door-plugin-pve-service.anywhere-door", "plugin_port": 80, "plugin_token": "token" }
3. 增加plugin配置信息: POST AnywhereDoorManager/config/create & Header: token: token & Body: [{"name": "pve name", "address": "https://pve.host:8006", "user": "admin user", "token": "token"}]

