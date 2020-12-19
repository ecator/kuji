const path = require('path')


/**
 * 管理奖品图片
 * @class Gift
 */
class Gift {


    /**
     * Creates an instance of Gift.
     * @param {string} giftPath
     * @memberof Gift
     */
    constructor(giftPath) {
        this.giftPath = giftPath
    }


    /**
     * 生成URL
     * @param {string} fileName
     * @returns {string} 
     * @memberof Gift
     */
    genUrl(fileName) {
        return path.join(this.giftPath, fileName).replace(/\\/g, '/')
    }
}

module.exports = Gift