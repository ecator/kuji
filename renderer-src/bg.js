const path = require('path')


/**
 * 管理窗体整体背景
 * @class BackGround
 */
class BackGround {


    /**
     * Creates an instance of BackGround.
     * @param {string} bgPath
     * @memberof BackGround
     */
    constructor(bgPath) {
        this.bgPath = bgPath
    }

    /**
     * 切换背景
     * @param {string} fileName
     * @memberof BackGround
     */
    changeBg(fileName) {
        document.body.style.backgroundImage = `url("${path.join(this.bgPath, fileName).replace(/\\/g, '/')}")`
    }
}

module.exports = BackGround