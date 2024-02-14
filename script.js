
utils.setup()
utils.setStyles()

var delta = 0
var lastTime = 0
var su = 0

var gs = [
    // [1, 1, -1],
    // [-1, 1, -1],
    // [-1, -1, -1]
]

for (let i = 0; i < 10; i++) {
    let g = []
    for (let j = 0; j < 10; j++) {
        g.push(Math.random()*2-1)
    }
    gs.push(g)
}

let minx = -1000
let miny = -1000
let maxx = 1000
let maxy = 1000


var fps = 0
var found = []
var quadtree = new Quadtree(0, 0, 2000, 2000)
var particles = []
for (let i = 0; i < 100; i++) {
    let p = new Point(Math.random()*2000-1000, Math.random()*2000-1000, i, Math.floor(Math.random()*gs.length))
    quadtree.insert(p)
    particles.push(p)
}

var camera = {x: 0, y: 0, zoom: 1}

function tsc(x, y) {
    return [(x-camera.x)*camera.zoom+canvas.width/2, (y-camera.y)*camera.zoom+canvas.height/2]
}

function force(r, a) {
    let beta = 0.2
	if (r < beta) {
		return r / beta - 1
	} else if (beta < r && r < 1) {
		return a * (1 - Math.abs(2 * r - 1 - beta) / (1 - beta))
	} else {
		return 0
	}
}

function tick() {
    let rMax = 80
    let forceFactor = 10
    let frictionHalfLife = 0.1
    let dt = 0.06
    let frictionFactor = Math.pow(0.5, dt / frictionHalfLife)

    if (mouse.ldown) {
        let i = Math.floor(Math.random()*particles.length)
        particles[i].x = (mouse.x-canvas.width/2)/camera.zoom + camera.x
        particles[i].y = (mouse.y-canvas.height/2)/camera.zoom + camera.y
    }

    let collapse = 0.999
    minx *= collapse
    miny *= collapse
    maxx *= collapse
    maxy *= collapse

    for (let p of particles) {
        let p2s = quadtree.getPoints(p.x, p.y, 160, 160)
        let tx = 0
        let ty = 0
        for (let p2 of p2s) {
            let g = gs[p.type][p2.type]
            let dx = p2.x - p.x
            let dy = p2.y - p.y
            let d = Math.sqrt(dx**2 + dy**2)
            if (d > 0 && d < rMax) {
                let f = force(d / rMax, gs[p.type][p2.type])
                tx += dx / d * f
                ty += dy / d * f
            }
        }
        tx *= rMax * forceFactor
        ty *= rMax * forceFactor
        p.vx *= frictionFactor
        p.vy *= frictionFactor
        p.vx += tx * dt
        p.vy += ty * dt

        if (p.x < minx) {p.x = minx}
        if (p.x > maxx) {p.x = maxx}
        if (p.y < miny) {p.y = miny}
        if (p.y > maxy) {p.y = maxy}
    }

    for (let p of particles) {
        p.x += p.vx*dt
        p.y += p.vy*dt

        // p.vx -= p.x*dt
        // p.vy -= p.y*dt

        if (p.x < minx) {minx = p.x; p.vx *= -1}
        if (p.x > maxx) {maxx = p.x; p.vx *= -1}
        if (p.y < miny) {miny = p.y; p.vy *= -1}
        if (p.y > maxy) {maxy = p.y; p.vy *= -1}
    }

    quadtree = new Quadtree(minx + (maxx-minx)/2, miny + (maxy-miny)/2, maxx-minx, maxy-miny)

    for (let p of particles) {
        quadtree.insert(p)
    }
}

var accumulator = 0
var tps = 20
var tDelta = 1/tps

function update(timestamp) {
    requestAnimationFrame(update)

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()
    input.setGlobals()

    fps++

    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [0, 0, 0, 1])

    if (keys["Minus"]) {
        camera.zoom *= 0.99
    }
    if (keys["Equal"]) {
        camera.zoom *= 1.01
    }

    if (keys["KeyW"]) {
        camera.y -= 500*delta / camera.zoom
    }
    if (keys["KeyS"]) {
        camera.y += 500*delta / camera.zoom
    }

    if (keys["KeyA"]) {
        camera.x -= 500*delta / camera.zoom
    }
    if (keys["KeyD"]) {
        camera.x += 500*delta / camera.zoom
    }

    accumulator += delta
    let startTime = new Date().getTime()
    while ((accumulator > tDelta || keys["KeyT"]) && new Date().getTime() - startTime < Math.min(1000/60, 1000*delta)) {
        tick()
        accumulator -= tDelta
    }
    if (keys["KeyT"]) {
        accumulator = 0
    }

    quadtree.draw()

    input.updateInput()
}

setInterval(() => {
    console.log(fps)
    fps = 0
}, 1000)

requestAnimationFrame(update)