const originalFs = require('original-fs')
const path = require('path')
const BackGround = require('./bg')
const Gift = require('./gift')
const Vue = require('vue')
const Sound = require('./sound')
const Config = require('./config')
require('./sass/index.scss')

let kuji

const CONF_PATH = path.join(process.env['HOME'] || process.env['USERPROFILE'], 'kuji')
const BG_PATH = path.join(CONF_PATH, 'bg')
const GIFT_PATH = path.join(CONF_PATH, 'gift')
const SOUND_PATH = path.join(CONF_PATH, 'sound')
if (!originalFs.existsSync(CONF_PATH)) {
    originalFs.mkdirSync(CONF_PATH)
}
const INI_FILE = path.join(CONF_PATH, 'config.ini')
if (!originalFs.existsSync(INI_FILE)) {
    originalFs.writeFileSync(INI_FILE, "", { encoding: 'utf-8' })
}

const INCLUDE_FILE_PATH = path.join(CONF_PATH, "include.txt")
const EXCLUDE_FILE_PATH = path.join(CONF_PATH, "exclude.txt")

const STATUS_NORMAL = Symbol('status_normal')
const STATUS_R1_RUNNING = Symbol('status_r1_running')
const STATUS_R2_RUNNING = Symbol('status_r2_running')
const STATUS_SHOW_RESULT = Symbol('status_show_result')

if (!originalFs.existsSync(INCLUDE_FILE_PATH)) {
    originalFs.writeFileSync(INCLUDE_FILE_PATH, "01=01,02", { encoding: 'utf-8' })
}
if (!originalFs.existsSync(EXCLUDE_FILE_PATH)) {
    originalFs.writeFileSync(EXCLUDE_FILE_PATH, "", { encoding: 'utf-8' })
}

let sound = new Sound(SOUND_PATH)
let config = new Config(INI_FILE)
let bg = new BackGround(BG_PATH)
let gift = new Gift(GIFT_PATH)

/**
 * 根据状态执行抽签流程
 */
function runkuji() {
    switch (kuji.status) {
        case STATUS_R1_RUNNING:
        case STATUS_R2_RUNNING:
            // 抽签进行中，直接跳过
            break
        case STATUS_NORMAL:
            // 初始状态（空）-> r1滚动 -> r2滚动
            kuji.flash()
            break
        case STATUS_SHOW_RESULT:
            // 中签结果显示（静止画面）-> 空白
            kuji.status = STATUS_NORMAL
            kuji.drawImageAll()
            break
    }
}



/**
 * 初始化抽签Vue对象
 */
function initKuji() {
    kuji = new Vue({
        el: '#kujiCanvasContainer',
        data: {
            id: 'kujiCanvas1',
            ids: ["kujiCanvas1"],
            width: 0,
            height: 0,
            r1: {
                r: 0,
                fontFamily: 'Consolas',
                fontColor: '#ff0000',
                bgColor: '#ffffff',
            },
            r2: {
                r: 0,
                fontFamily: 'Consolas',
                fontFamilyActive: 'Consolas',
                fontColor: '#ff0000',
                fontColorActive: '#ff0000',
                bgColor: '#ffffff',
                bgColorActive: '#0000ff',
            },
            // 圆心坐标
            coordinate: {
                x: 0,
                y: 0
            },
            // 时间间隔变化函数相关参数
            intervalFun: {
                a: 1 / 100,
                exp: 2,
                duration: 5000
            },
            optionKey: 'tab',//触发开始抽奖的备用按键
            bgIdx: 1,
            status: STATUS_NORMAL,
            activeR1Title: '', //当前内圆标题
            activeR1Titles: [], //所有内圆标题
            activeR2Styles: [], //当前外圆状态
            activeR2StylesMatrix: [], //所有外圆状态
            activeR2Idx: -1, //当前外圆高亮ID
            activeR2Idxs: [], //所有外圆高亮ID
            bukets: {},
            buketsChosen: {}
        },
        mounted() {
            // 加载配置
            this.r1.fontFamily = config.read('r1', 'fontFamily', this.r1.fontFamily)
            this.r1.fontColor = config.read('r1', 'fontColor', this.r1.fontColor)
            this.r1.bgColor = config.read('r1', 'bgColor', this.r1.bgColor)
            this.r2.fontFamily = config.read('r2', 'fontFamily', this.r2.fontFamily)
            this.r2.fontFamilyActive = config.read('r2', 'fontFamilyActive', this.r2.fontFamilyActive)
            this.r2.fontColor = config.read('r2', 'fontColor', this.r2.fontColor)
            this.r2.fontColorActive = config.read('r2', 'fontColorActive', this.r2.fontColorActive)
            this.r2.bgColor = config.read('r2', 'bgColor', this.r2.bgColor)
            this.r2.bgColorActive = config.read('r2', 'bgColorActive', this.r2.bgColorActive)
            this.optionKey = config.read('flash', 'optionKey', this.optionKey)
            this.bgIdx = 0
            this.width = this.computeSize()
            this.bukets = this.readBukets(INCLUDE_FILE_PATH)
            this.buketsChosen = this.readBukets(EXCLUDE_FILE_PATH)
            // 排除已经抽过的
            for (let title in this.bukets) {
                if (title in this.buketsChosen) {
                    for (let item of this.buketsChosen[title]) {
                        let i = this.bukets[title].indexOf(item)
                        if (i >= 0) {
                            this.bukets[title].splice(i, 1)
                        }
                    }
                } else {
                    this.buketsChosen[title] = []
                }
            }
        },
        updated() {
            // console.log('updated')
            if (this.status == STATUS_SHOW_RESULT) {
                // 重绘展示界面
                this.drawRingAll()
            } else if (this.status == STATUS_NORMAL) {
                // 重绘礼品图
                this.drawImageAll()
            }
        },
        watch: {
            width: function (newVal, oldVal) {
                this.coordinate.x = this.width / 2
                this.r1.r = this.computeR1()
                this.r2.r = this.computeR2()
                this.height = this.width
            },
            height: function (newVal, oldVal) {
                this.coordinate.y = this.height / 2
            },
            bgIdx: function (newVal, oldVal) {
                // 切换背景
                bg.changeBg(config.read('bg', this.bgIdx, this.bgIdx + '.jpg'))
                // 根据不同背景设定不同的时间函数参数
                let a = parseFloat(eval(config.read('intervalFun', 'a', this.intervalFun.a)))
                this.intervalFun.a = parseFloat(eval(config.read('intervalFun' + this.bgIdx, 'a', a)))
                let exp = parseFloat(eval(config.read('intervalFun', 'exp', this.intervalFun.exp)))
                this.intervalFun.exp = parseFloat(eval(config.read('intervalFun' + this.bgIdx, 'exp', exp)))
                let duration = parseInt(parseFloat(eval(config.read('intervalFun', 'duration', this.intervalFun.duration / 1000))) * 1000)
                this.intervalFun.duration = parseInt(parseFloat(eval(config.read('intervalFun' + this.bgIdx, 'duration', duration / 1000))) * 1000)

                // 刷新礼品图
                if (this.status = STATUS_NORMAL) {
                    this.drawImageAll()
                }
            },
            ids: function (newVal, oldVal) {
                if (this.status == STATUS_NORMAL) {
                    // 重新计算宽度
                    this.width = this.computeSize()
                }
            }
        },
        methods: {

            /**
             * 根据窗体大小计算出合适的宽度
             * @returns {number} 
             */
            computeSize() {
                let width = document.body.clientWidth
                let height = document.body.clientHeight
                let scale = 0
                let idsCnt = this.ids.length
                if (idsCnt <= 1) {
                    scale = 0.8
                } else if (idsCnt <= 3) {
                    scale = 1 / idsCnt
                } else {
                    scale = 1 / 3
                }
                let size = (width < height ? width : height) * scale
                return size
            },

            /**
             * 根据外周圆的个数计算出合适的外周圆半径
             * @param {number} n
             * @returns {number} 
             */
            getSuitableR2(n) {
                let r2 = this.r2.r
                let r1 = this.r1.r
                let nMax = Math.floor(Math.PI / Math.asin(r2 / (r1 + r2)))
                if (n > nMax) {
                    // n超过最大值就缩小r2
                    let m = Math.sin(Math.PI / n)
                    r2 = Math.floor(r1 * m / (1 - m))
                    //console.log(`n(${n}) 超过了 nMax(${nMax})，调整r2为 ${r2}`)
                }
                return r2
            },

            /**
             * 根据半径和文本的长度计算合适的字体大小
             * @param {number} r
             * @param {string} text
             * @returns {number} 
             */
            computeFontSize(r, text) {
                if (!text) {
                    text = ' '
                }
                return r / (Math.sin(Math.PI / 4) * text.length)
            },

            /**
             * 根据画布大小计算出合适的内圆半径
             * @returns {number} 
             */
            computeR1() {
                return Math.floor(this.computeSize() / 7 * 1.5)
            },

            /**
             * 根据画布大小计算出合适的外圆半径
             * @returns {number} 
             */
            computeR2() {
                return Math.floor(this.computeR1() / 1.5)
            },

            /**
             * 获取剩余奖品最大数量
             * @returns {number} 
             */
            getMaxKujiCount() {
                let cnt = 0
                for (let i in this.bukets) {
                    cnt += this.bukets[i].length
                }
                return cnt
            },

            /**
             * 绘制所有圆环
             */
            drawRingAll() {
                for (let i = 0; i < this.ids.length; i++) {
                    this.id = this.ids[i]
                    this.activeR1Title = this.activeR1Titles[i]
                    if (i < this.activeR2Idxs.length) {
                        this.activeR2Idx = this.activeR2Idxs[i]
                        this.activeR2Styles = this.activeR2StylesMatrix[i]
                    }
                    this.drawRing()
                }
            },
            /**
             * 根据当前状态画一个圆环
             */
            drawRing() {
                let r2Styles = this.activeR2Styles
                x = this.coordinate.x
                y = this.coordinate.y
                r1 = this.r1.r
                this.clearCanvas()
                let ctx = this.getCanvas()
                ctx.textBaseline = "middle"
                ctx.textAlign = "center";
                ctx.beginPath()
                ctx.arc(x, y, r1, 0, Math.PI * 2)
                ctx.fillStyle = this.r1.bgColor
                ctx.fill()
                ctx.font = this.computeFontSize(r1, this.activeR1Title) + "px " + this.r1.fontFamily
                ctx.fillStyle = this.r1.fontColor
                ctx.fillText(this.activeR1Title, x, y)
                let n = r2Styles.length
                let r2 = this.getSuitableR2(n)
                for (let i = 0; i < n; i++) {
                    //console.log(`drawing(activeR2Idx:${this.activeR2Idx}) ${this.activeR1Title}-${r2Styles[i]['title']}-${i}`)
                    ctx.beginPath()
                    let xn = x + (r1 + r2) * Math.cos(2 * Math.PI / n * i)
                    let yn = y + (r1 + r2) * Math.sin(2 * Math.PI / n * i)
                    ctx.arc(xn, yn, r2, 0, Math.PI * 2)
                    ctx.fillStyle = r2Styles[i]['bgColor']
                    ctx.fill()
                    ctx.font = this.computeFontSize(r2, r2Styles[i]['title']) + "px " + r2Styles[i]['fontFamily']
                    ctx.fillStyle = r2Styles[i]['fontColor']
                    ctx.fillText(r2Styles[i]['title'], xn, yn)
                }
            },

            /**
             * 在所有画布绘制gift图片（初始状态）
             */
            drawImageAll() {
                // 更换礼品图
                for (let i of this.ids) {
                    this.id = i
                    this.drawImage()
                }
            },

            /**
             * 根据当前状态绘制gift图片（初始状态）
             */
            drawImage() {
                let ctx = this.getCanvas()
                this.clearCanvas()
                let img = new Image()
                img.src = gift.genUrl(config.read('gift', this.bgIdx, this.bgIdx + '.png'))
                _this = this
                img.onload = function () {
                    ctx.drawImage(img, 0, 0, _this.width, _this.height)
                }
            },

            /**
             * 返回2d上下文
             * @returns {CanvasRenderingContext2D} 
             */
            getCanvas() {
                let canvas = document.getElementById(this.id)
                let ctx = canvas.getContext('2d')
                return ctx
            },

            /**
             * 清除画布
             */
            clearCanvas() {
                let ctx = this.getCanvas()
                ctx.clearRect(0, 0, this.width, this.height)
            },

            /**
             * 滚动效果
             */
            flash() {
                this.activeR1Title = ''
                this.activeR1Titles = []
                this.activeR2Idx = -1
                this.activeR2Idxs = []
                this.activeR2Styles = []
                this.activeR2StylesMatrix = []
                let duration = this.intervalFun.duration
                let flashR1 = new Promise((resolve, reject) => {

                    let titles = Object.keys(kuji.bukets).filter((item) => this.bukets[item].length > 0)
                    //console.log(titles)
                    n = titles.length
                    if (this.ids.length > this.getMaxKujiCount()) {
                        this.status = STATUS_NORMAL
                        if (n == 0) {
                            reject("もう終わりましたよ（笑）")
                        } else {
                            reject("参加者が足りません（涙）")
                        }
                        return
                    }
                    let r1Duration = duration
                    // 最大可供抽选的内圆数量刚好为抽选数量时立即结束
                    if (n <= this.ids.length) {
                        r1Duration = 0
                    }
                    sound.play(config.read('sound', 'bg', 'bg.mp3'))
                    this.flashR1(resolve, titles, r1Duration, 0, 0)
                })
                flashR1.then(() => {
                    return new Promise((resolve, reject) => {
                        let titlesCnt = {}
                        for (let i of this.activeR1Titles) {
                            titlesCnt[i] = this.bukets[i].length
                        }
                        let n = Object.keys(titlesCnt).reduce((total, cur) => titlesCnt[cur] + total, 0)
                        let r2Duration = duration
                        // 最大可供抽选的数量刚好为抽选数量时立即结束
                        if (n <= this.ids.length) {
                            r2Duration = 0
                        }
                        this.flashR2(resolve, r2Duration, 0, 0)
                    })
                }).then(() => {
                    sound.play(config.read('sound', 'active', 'active.mp3'), false)
                    this.status = STATUS_SHOW_RESULT
                    //alert(this.r1Title + '-' + this.r2TitleIdx)
                    // 剔除已经抽选的
                    let removeBukets = {}
                    for (let i = 0; i < this.activeR1Titles.length; i++) {
                        let r1 = this.activeR1Titles[i]
                        if (r1 in removeBukets) {
                            removeBukets[r1].push(this.activeR2Idxs[i])
                            // 降序排序
                            removeBukets[r1].sort((a, b) => b - a)
                        } else {
                            removeBukets[r1] = [this.activeR2Idxs[i]]
                        }
                    }
                    for (let i in removeBukets) {
                        for (let idx of removeBukets[i]) {
                            this.buketsChosen[i].push(this.bukets[i].splice(idx, 1)[0])
                        }
                    }
                }).catch((reason) => {
                    alert(reason)
                })
            },

            /**
             * 滚动内圆
             * @param {function} resolve
             * @param {string[]} titles
             * @param {number} duration 总持续时间，单位为ms
             * @param {number} cur 已经滚动的时间，单位为ms
             * @param {number} frm 第几帧，用于计算下一帧的时间
             */
            flashR1(resolve, titles, duration, cur, frm) {
                this.status = STATUS_R1_RUNNING
                let titlesCnt = {}
                for (let i of titles) {
                    titlesCnt[i] = this.bukets[i].length
                }
                this.activeR1Titles = []
                for (let i = 0; i < this.ids.length; i++) {
                    let activeTitles = Object.keys(titlesCnt).filter((item) => titlesCnt[item] > 0)
                    let activeTitle = activeTitles[Math.floor(Math.random() * activeTitles.length)]
                    titlesCnt[activeTitle]--
                    this.activeR1Titles.push(activeTitle)
                }
                this.drawRingAll()
                if (cur >= duration) {
                    resolve()
                    return
                }
                frm++
                let nextInterval = this.genNextInterval(frm)
                cur += duration - cur <= nextInterval ? duration - cur : nextInterval
                setTimeout(() => {
                    this.flashR1(resolve, titles, duration, cur, frm)
                }, nextInterval)
            },

            /**
             * 滚动外圆
             * @param {function} resolve
             * @param {number} duration 总持续时间，单位为ms
             * @param {number} cur 已经滚动的时间，单位为ms
             * @param {number} frm 第几帧，用于计算下一帧的时间
             */
            flashR2(resolve, duration, cur, frm) {
                this.status = STATUS_R2_RUNNING
                let idxs = {}
                for (let i of this.activeR1Titles) {
                    idxs[i] = this.bukets[i].map((item, index) => index)
                }
                this.activeR2Idxs = []
                this.activeR2StylesMatrix = []
                for (let i = 0; i < this.ids.length; i++) {
                    let activeIdxs = idxs[this.activeR1Titles[i]]
                    let idx = Math.floor(Math.random() * activeIdxs.length)
                    this.activeR2Idxs.push(activeIdxs[idx])
                    activeIdxs.splice(idx, 1)
                    // 计算外圆状态
                    this.activeR1Title = this.activeR1Titles[i]
                    this.activeR2Idx = this.activeR2Idxs[i]
                    this.genR2Styles()
                    this.activeR2StylesMatrix.push(this.activeR2Styles)
                }
                this.drawRingAll()
                if (cur >= duration) {
                    resolve()
                    return
                }
                frm++
                let nextInterval = this.genNextInterval(frm)
                cur += duration - cur <= nextInterval ? duration - cur : nextInterval
                setTimeout(() => {
                    this.flashR2(resolve, duration, cur, frm)
                }, nextInterval)
            },

            /**
             * 简单粗暴地用了一个 a*x^exp 的抛物线函数来计算间隔时间
             * @param {number} frm 第几帧
             * @returns {number} 
             */
            genNextInterval(frm) {
                let next = Math.ceil(Math.pow(frm, this.intervalFun.exp) * this.intervalFun.a)
                return next
            },

            /**
             * 计算出当前外圆的状态
             */
            genR2Styles() {
                this.activeR2Styles = []
                if (this.activeR2Idx < 0) {
                    return
                }
                let titles = this.bukets[this.activeR1Title]
                if (!titles) {
                    return
                }
                for (let i = 0; i < titles.length; i++) {
                    let style = {
                        'title': titles[i],
                        'fontFamily': i == this.activeR2Idx ? this.r2.fontFamilyActive : this.r2.fontFamily,
                        'fontColor': i == this.activeR2Idx ? this.r2.fontColorActive : this.r2.fontColor,
                        'bgColor': i == this.activeR2Idx ? this.r2.bgColorActive : this.r2.bgColor
                    }
                    this.activeR2Styles.push(style)
                }
            },

            /**
             * 读取待抽取的列表
             * @param {string} fileName
             * @returns {{'title...':[]}} 
             */
            readBukets(fileName) {
                let content = originalFs.readFileSync(fileName, { encoding: "utf8" }).trim().replace(/\r/g, '').split('\n')
                let bukets = {}
                for (let item of content) {
                    if (item.indexOf('=') > 0) {
                        let tmp = item.trim().split('=')
                        if (tmp[1].trim().length > 0) {
                            bukets[tmp[0]] = tmp[1].trim().split(',')
                        } else {
                            bukets[tmp[0]] = []
                        }
                    }
                }
                return bukets
            },

            /**
             * 将抽签列表写入到文件
             * @param {string} fileName
             * @param {{'titles...':[]}} obj
             */
            saveBukets(fileName, obj) {
                let bukets = []
                for (let i in obj) {
                    bukets.push(i + '=' + obj[i].join(','))
                }
                originalFs.writeFileSync(fileName, bukets.join(process.platform.startsWith('win') ? '\r\n' : '\n'), { encoding: 'utf-8' })
            }
        }
    })
}

window.addEventListener("load", function () {
    // 默认显示0号背景
    bg.changeBg(config.read('bg', '0', '0.jpg'))
    // 初始化抽签对象
    initKuji()
})

window.addEventListener('resize', function () {
    // 重绘抽签区域
    kuji.width = kuji.computeSize()
})

window.addEventListener('keyup', (event) => {
    let key = event.code.toLowerCase()
    // console.log(key,event)
    if (!event.ctrlKey) {
        switch (key) {
            case 'space':
                // 开始抽签
                runkuji()
                break
            case kuji.optionKey:
                // 非初期状态不允许触发抽签
                if (kuji.status != STATUS_NORMAL) {
                    return
                }
                runkuji()
                break
            case /^digit[0-9]$/.test(key) && key:
                // 0-9 切换背景
                if (kuji.status != STATUS_NORMAL) {
                    return
                }
                let bgIndex = key.substr(-1)
                kuji.bgIdx = bgIndex
                break
        }
    } else {
        switch (key) {
            case 'keys':
                // 保存已经抽出的列表
                kuji.saveBukets(EXCLUDE_FILE_PATH, kuji.buketsChosen)
                alert("当たったやつらを覚えました（笑）")
                break
            case /^digit[1-9]$/.test(key) && key:
                // 1-9 切换礼品个数
                if (kuji.status != STATUS_NORMAL) {
                    return
                }
                let cnt = key.substr(-1)
                if (cnt > kuji.getMaxKujiCount()) {
                    alert("参加者が足りません（涙）")
                    return
                }
                let ids = []
                for (let i = 1; i <= cnt; i++) {
                    ids.push('kujiCanvas' + i)
                }
                kuji.ids = ids
                break
        }
    }
}, true)