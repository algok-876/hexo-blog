let originImg = null
let cloneImg = null
function init() {
    addImgListener()
}

function lockBody() {
    document.body.classList.add('lockscreen')
}
function unlockBody() {
    document.body.classList.remove('lockscreen')
}
function addImgListener() {
    const imgs = document.querySelectorAll('img')
    imgs.forEach(img => {
        img.addEventListener('click', () => {
            originImg = img
            cloneImg = img.cloneNode()
            originImg.style.opacity = '0'
            lockBody()
            openPreviewModal()
        })
    })
}

// 用于修改样式的工具类，并且可以减少回流重绘，后面代码中会频繁用到
function changeStyle(el, arr) {
    const original = el.style.cssText.split(';')
    original.pop()
    el.style.cssText = original.concat(arr).join(';') + ';'
}

// 打开遮照层
function openPreviewModal() {
    const modal = document.createElement('div')
    modal.className = 'modal'
    modal.appendChild(cloneImg)

    // 添加到页面中
    document.body.appendChild(modal)
    zoom()
    // 添加点击小时事件
    modal.addEventListener('click', () => {
        const { left, top } = originImg.getBoundingClientRect()
        changeStyle(cloneImg, ['transition: all .3s', `left: ${left}px`,
            `top: ${top}px`,
            `transform: translate(0,0)`,
            `width: ${originImg.offsetWidth}px`])
        setTimeout(() => {
            document.body.removeChild(modal)
            originImg.style.opacity = '1'
            unlockBody()
        }, 300);
    })
}

// 计算自适应屏幕的缩放值
function adaptScale() {
    const { offsetWidth: w, offsetHeight: h } = originImg // 获取文档中图片的宽高
    let scale = 0
    scale = window.innerWidth / w
    if (h * scale > window.innerHeight - 80) {
        scale = (window.innerHeight - 80) / h
    }
    return scale > 2 ? 2 : scale
}

// 缩放图片
function zoom() {
    const originImgPosition = originImg.getBoundingClientRect()
    // 设置克隆图片在preview框内的初始位置
    changeStyle(cloneImg, [`left: ${originImgPosition.left}px`, `top: ${originImgPosition.top}px`])
    // 根据缩放比例计算实际大小，根据距屏幕中心的距离设置偏移
    const winCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const originImgCenter = { x: originImg.offsetWidth / 2 + originImgPosition.left, y: originImg.offsetHeight / 2 + originImgPosition.top }
    const offsetDistance = {
        left: winCenter.x - originImgCenter.x + originImgPosition.left,
        top: winCenter.y - originImgCenter.y + originImgPosition.top
    }
    const diffs = { left: ((adaptScale() - 1) * originImg.offsetWidth) / 2, top: ((adaptScale() - 1) * originImg.offsetHeight) / 2 }
    changeStyle(cloneImg, ['transition: all .3s',
        `width: ${originImg.offsetWidth * adaptScale() + 'px'}`,
        `transform: translate(${offsetDistance.left - originImgPosition.left - diffs.left}px,${offsetDistance.top - originImgPosition.top - diffs.top}px)`])
    // 动画结束后消除定位重置的偏差
    setTimeout(() => {
        changeStyle(cloneImg, ['transition: all 0s', `left: 0`, `top: 0`, `transform: translate(${offsetDistance.left - diffs.left}px, ${offsetDistance.top - diffs.top}px)`])
    }, 300)
}
init()