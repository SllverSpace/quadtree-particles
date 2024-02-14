
class Point {
    x = 0
    y = 0
    id = 0
    vx = 0
    vy = 0
    type = 0
    constructor(x, y, id, type) {
        this.x = x
        this.y = y
        this.id = id
        this.type = type
    }
    draw() {
        ctx.beginPath()
        ctx.arc(...tsc(this.x, this.y), 5*camera.zoom, 0, Math.PI*2)
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
    constructor(x, y, width, height) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
    split() {
        this.topleft = new Quadtree(this.x-this.width/4, this.y-this.height/4, this.width/2, this.height/2)
        this.bottomleft = new Quadtree(this.x-this.width/4, this.y+this.height/4, this.width/2, this.height/2)
        this.topright = new Quadtree(this.x+this.width/4, this.y-this.height/4, this.width/2, this.height/2)
        this.bottomright = new Quadtree(this.x+this.width/4, this.y+this.height/4, this.width/2, this.height/2)
    }
    insert(point) {
        if (point.x < this.x-this.width/2 || point.x > this.x+this.width/2 || point.y < this.y-this.height/2 || point.y > this.y+this.height/2) return false
        if (this.points.length < this.maxPoints) {
            this.points.push(point)
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
            points.push(...this.points)
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
        if (tsc(this.x-this.width/2, 0).x < 0 || tsc(this.x+this.width/2, 0).x > canvas.width || tsc(this.y-this.height/2, 0).y < 0 || tsc(this.y+this.height/2, 0).y > canvas.height) return
        ui.rect(...tsc(this.x, this.y), this.width*camera.zoom, this.height*camera.zoom, [0, 0, 0, 0], 1*camera.zoom, [50, 50, 50, 1])
        for (let point of this.points) {
            point.draw()
        }
        if (this.topleft) this.topleft.draw()
        if (this.bottomleft) this.bottomleft.draw()
        if (this.topright) this.topright.draw()
        if (this.bottomright) this.bottomright.draw()
    }
}