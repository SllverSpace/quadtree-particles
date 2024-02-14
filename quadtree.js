
class Point {
    x = 0
    y = 0
    lx = 0
    ly = 0
    vix = 0
    viy = 0
    id = 0
    vx = 0
    vy = 0
    type = 0
    qt
    checkRange = 0
    constructor(x, y, id, type) {
        this.x = x
        this.y = y
        this.lx = x
        this.ly = y
        this.vix = x
        this.viy = y
        this.id = id
        this.type = type
        this.checkRange = fetchRange
    }
    getQt() {
        let qt = this.qt
        if (!qt) qt = quadtree
        while (qt.parent && (
            (this.x-this.checkRange/2 < this.qt.x-this.qt.width/2 && this.x-this.checkRange/2 > minx) || 
            (this.x+this.checkRange/2 < this.qt.x+this.qt.width/2 && this.x+this.checkRange/2 < maxx) ||
            (this.y-this.checkRange/2 < this.qt.y-this.qt.height/2 && this.y-this.checkRange/2 > miny) || 
            (this.y+this.checkRange/2 < this.qt.y+this.qt.height/2 && this.y+this.checkRange/2 < maxy)
        )) {
            qt = qt.parent
        }
        return qt
    }
    draw() {
        let amt = accumulator / tDelta

        this.vix = this.x * amt + this.lx * (1 - amt)
        this.viy = this.y * amt + this.ly * (1 - amt)

        ctx.beginPath()
        ctx.arc(...tsc(this.vix, this.viy), Math.max(1, 5*camera.zoom), 0, Math.PI*2)
        ctx.fillStyle = `hsl(${(this.type+1) / gs.length * 360}, 100%, 50%)`
        ctx.fill()
    }
}

class Quadtree {
    x = 0
    y = 0
    width = 0
    height = 0
    maxPoints = 10
    topleft
    bottomleft
    topright
    bottomright
    points = []
    beenSplit = false
    parent
    constructor(x, y, width, height, parent=null) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.parent = parent
    }
    split() {
        this.topleft = new Quadtree(this.x-this.width/4, this.y-this.height/4, this.width/2, this.height/2, this)
        this.bottomleft = new Quadtree(this.x-this.width/4, this.y+this.height/4, this.width/2, this.height/2, this)
        this.topright = new Quadtree(this.x+this.width/4, this.y-this.height/4, this.width/2, this.height/2, this)
        this.bottomright = new Quadtree(this.x+this.width/4, this.y+this.height/4, this.width/2, this.height/2, this)
    }
    insert(point) {
        if (point.x < this.x-this.width/2 || point.x > this.x+this.width/2 || point.y < this.y-this.height/2 || point.y > this.y+this.height/2) return false
        if (this.points.length < this.maxPoints || !useQuadtree) {
            this.points.push(point)
            point.qt = this
            return true
        } else {
            if (!this.beenSplit) {
                this.split()
                this.beenSplit = true
            }
            if (this.topleft.insert(point)) return true
            if (this.bottomleft.insert(point)) return true
            if (this.topright.insert(point)) return true
            if (this.bottomright.insert(point)) return true
            return false
        }
    }
    getPoints(x, y, width, height) {
        let points = []
        if (this.intersectsRect(x, y, width, height)) {
            for (let point of this.points) {
                if (point.x > x-width/2 && point.x < x+width/2 && point.y > y-height/2 && point.y < y+height/2) {
                    points.push(point)
                }
            }
            if (this.topleft) points.push(...this.topleft.getPoints(x, y, width, height))
            if (this.bottomleft) points.push(...this.bottomleft.getPoints(x, y, width, height))
            if (this.topright) points.push(...this.topright.getPoints(x, y, width, height))
            if (this.bottomright) points.push(...this.bottomright.getPoints(x, y, width, height))
        }
        return points
    }
    intersectsRect(x, y, width, height) {
        return x+width/2 > this.x-this.width/2 && x-width/2 < this.x+this.width/2 && y+height/2 > this.y-this.height/2 && y-height/2 < this.y+this.height/2
    }
    draw() {
        if (!this.intersectsRect(camera.x, camera.y, canvas.width/camera.zoom, canvas.height/camera.zoom)) return
        
        if (debug) {
            ui.rect(...tsc(this.x, this.y), this.width*camera.zoom, this.height*camera.zoom, [0, 0, 0, 0], Math.max(1, 1*camera.zoom), [100, 100, 100, 1])
        }
        for (let point of this.points) {
            point.draw()
            if (debug2) {
                ui.rect(...tsc(point.qt.x, point.qt.y), point.qt.width*camera.zoom, point.qt.height*camera.zoom, [0, 0, 0, 0], Math.max(1, 1*camera.zoom), [0, 100, 0, 1])
            }
            if (debug3) {
                ui.rect(...tsc(point.x, point.y), point.checkRange*camera.zoom, point.checkRange*camera.zoom, [0, 0, 0, 0], Math.max(1, 1*camera.zoom), [100, 0, 0, 1])
            }
        }
        if (this.topleft) this.topleft.draw()
        if (this.bottomleft) this.bottomleft.draw()
        if (this.topright) this.topright.draw()
        if (this.bottomright) this.bottomright.draw()
    }
}