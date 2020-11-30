class BackGround {
    #bgPath
    #ext
    constructor(bgPath, ext = 'jpg') {
        this.#bgPath = bgPath
        this.#ext = ext
    }
    changeBg(index) {
        if (isNaN(index) || index < 0 || index > 9) {
            index = 0
        }
        index = parseInt(index)
        document.body.style.backgroundImage = `url("${path.join(this.#bgPath, `${index}.${this.#ext}`).replace(/\\/g, '/')}")`
    }
}

module.exports = BackGround