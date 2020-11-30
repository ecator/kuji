const originalFs = require('original-fs')
const fs = require('fs')
const path = require('path')
const BackGround = require('./renderer/bg')

let kuji = {
    'include': [['id', 'name']],
    'exclude': [['id', 'name']],
    'members': [['id', 'name']],
    'pass': [],
    'speed': 0.3,
    'status': 0
}
const CONF_PATH = path.join(process.env['HOME'] || process.env['USERPROFILE'], 'kuji')
const BG_PATH = path.join(CONF_PATH, 'bg')
if (!originalFs.existsSync(CONF_PATH)) {
    originalFs.mkdirSync(CONF_PATH)
}

const INCLUDE_CSV_PATH = path.join(CONF_PATH, "include.csv")
const EXCLUDE_CSV_PATH = path.join(CONF_PATH, "exclude.csv")

if (!originalFs.existsSync(INCLUDE_CSV_PATH)) {
    originalFs.writeFileSync(INCLUDE_CSV_PATH, "1,test1\n2,test2\n3,test3", { encoding: 'utf-8' })
}
if (!originalFs.existsSync(EXCLUDE_CSV_PATH)) {
    originalFs.writeFileSync(EXCLUDE_CSV_PATH, "2,test2", { encoding: 'utf-8' })
}

function readMembers(fileName) {
    let content = originalFs.readFileSync(fileName, { encoding: "utf8" }).trim()
    if (content.length > 0) {
        content = content.replace(/\r/, '').split('\n')
    } else {
        content = []
    }
    content.forEach((item, i) => {
        if (item.indexOf(',') > 0) {
            content[i] = item.split(',', 2)
        } else {
            content[i] = [item, item]
        }
    })
    return content
}

function filterMembers(include, exclude) {
    //console.log(include, exclude)
    let members = []
    for (let i = 0; i < include.length; i++) {
        let excluded = false
        for (let j = 0; j < exclude.length; j++) {
            if (include[i][0] == exclude[j][0]) {
                excluded = true
                break
            }
        }
        if (!excluded) {
            members.push(include[i])
        }
    }
    return members
}

function genTags(members) {
    let tags = `
        <ul>
            ${members.map((item, i) =>
        `<li><a href="#" class="${kuji['pass'].indexOf(i) >= 0 ? 'kuji-pass' : 'kuji-ok'}" id="kuji-${item[0]}">${item[1]}</a></li>`
    ).join('\n')}
        </ul>
    `
    return tags
}

function runkuji() {
    kuji['status'] = (kuji['status'] + 1) % 2
    kuji['speed'] = kuji['status'] == 0 ? 0.3 : 10
    if (kuji['status'] == 0) {
        // 显示抽奖结果
        if (kuji['pass'].length == kuji['members'].length) {
            alert("終了しましたよ（笑）")
        } else {
            // 找出还没有抽过的索引
            let candidates = [];
            kuji['members'].forEach((item, i) => {
                if (kuji['pass'].indexOf(i) == -1) {
                    candidates.push(i)
                }
            })
            //console.log(candidates)
            // 随机生成一个中签索引
            let idx = candidates[Math.floor(Math.random() * candidates.length)]
            kuji['pass'].push(idx)
            alert(kuji['members'][idx][1] + '\n' + kuji['members'][idx][0])
        }
        reloadKuji(kuji['members'])
    } else {
        TagCanvas.SetSpeed('kujiCanvas', [kuji['speed'], 0])
    }

}

function reloadKuji() {
    let kujiCanvas = document.getElementById('kujiCanvas')
    let width = document.body.clientWidth
    let height = document.body.clientHeight
    let size = (width < height ? width : height) * 0.8
    kujiCanvas.width = size
    kujiCanvas.height = size
    TagCanvas.Delete(kujiCanvas.id);
    document.getElementById(kujiCanvas.id).innerHTML = genTags(kuji['members'])
    try {
        TagCanvas.Start(kujiCanvas.id, '', {
            textColour: null,
            depth: 0.0,
            initial: [kuji['speed'], 0],
            noMouse: true

        })
    } catch (e) {
        // something went wrong, hide the canvas container
        alert(e)
    }
}

let bg = new BackGround(BG_PATH)
bg.changeBg(0)

window.onload = function () {
    kuji['include'] = readMembers(INCLUDE_CSV_PATH)
    kuji['exclude'] = readMembers(EXCLUDE_CSV_PATH)
    kuji['members'] = filterMembers(kuji['include'], kuji['exclude'])
    reloadKuji(kuji['members'])
}

window.onresize = function () {
    reloadKuji(kuji['members'])
}

window.addEventListener('keyup', (event) => {
    if (!event.ctrlKey) {
        let key = event.code.toLowerCase()
        console.log(key)
        switch (key) {
            case 'space':
                runkuji()
                break
            case /^digit[0-9]$/.test(key) && key:
                bg.changeBg(key.substr(-1))
                break
        }
    }
}, true)