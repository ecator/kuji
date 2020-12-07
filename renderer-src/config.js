const originalFs = require('original-fs')
const ini = require('ini')


/**
 * 管理配置文件
 * @class Config
 */
class Config {

    /**
     * Creates an instance of Config.
     * @param {string} iniPath
     * @memberof Config
     */
    constructor(iniPath) {
        this.iniObj = ini.parse(originalFs.readFileSync(iniPath, { encoding: 'utf8' }))
    }

    /**
     * 读取指定配置的值
     * @param {string} secName
     * @param {string} key
     * @param {any} [whenEmpty='']
     * @returns {string} 
     * @memberof Config
     */
    read(secName, key, whenEmpty = '') {
        let sec = this.iniObj[secName]
        if (!sec) {
            return whenEmpty
        }
        let val = sec[key]
        if (!val) {
            return whenEmpty
        }
        return val
    }
}

module.exports = Config