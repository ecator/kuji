const path = require('path')


/**
 * 管理效果音乐
 * @class Sound
 */
class Sound {

    /**
     * Creates an instance of Sound.
     * @param {string} soundPath
     * @memberof Sound
     */
    constructor(soundPath) {
        this.soundPath = soundPath
        this.audio = new Audio()
        this.audio.onloadeddata = () => { this.audio.play() }
    }

    /**
     * 播放效果音乐
     * @param {string} fileName
     * @param {boolean} [loop=true]
     * @memberof Sound
     */
    play(fileName, loop = true) {
        this.stop()
        this.audio.loop = loop
        let url = path.join(this.soundPath, fileName).replace().replace(/\\/g, '/')
        if (this.audio.src == url) {
            this.audio.play()
        } else {
            this.audio.src = url
        }
    }

    /**
     * 停止播放
     * @memberof Sound
     */
    stop() {
        this.audio.pause()
    }
}

module.exports = Sound