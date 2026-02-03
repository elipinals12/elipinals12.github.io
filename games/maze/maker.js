function makeIndex(hor, ver) {
    if (ver < 0 || ver > tcols - 1 || hor < 0 || hor > trows - 1) {
        return undefined;
    } else {
        return hor + ver * trows;
    }
}

function Cell(hor, ver) {
    this.hor = hor;
    this.ver = ver;
    this.visited = false;
    this.dead = false;
    this.walls = [true, true, true, true];

    this.highlight = function () {
        var x = hor * wid;
        var y = ver * wid;

        noStroke();
        fill(60, 200, 50);
        ellipse(x + wid / 2, y + wid / 2, 15, 15);
    }

    this.makeWalls = function () {
        var x = hor * wid;
        var y = ver * wid;

        this.checkNeighbors = function () {
            var neighbors = [];

            var top = grid[makeIndex(hor, ver - 1)];
            var right = grid[makeIndex(hor + 1, ver)];
            var bottom = grid[makeIndex(hor, ver + 1)];
            var left = grid[makeIndex(hor - 1, ver)];

            if (top && !top.visited) {
                append(neighbors, top);
            }
            if (right && !right.visited) {
                append(neighbors, right);
            }
            if (bottom && !bottom.visited) {
                append(neighbors, bottom);
            }
            if (left && !left.visited) {
                append(neighbors, left);
            }

            if (neighbors.length > 0) {
                var r = floor(random(0, neighbors.length));
                return neighbors[r];
            } else {
                return undefined;
            }
        }

        stroke(0);
        if (this.walls[0]) {
            line(x, y, x + wid, y);
        }
        if (this.walls[1]) {
            line(x + wid, y, x + wid, y + wid);
        }
        if (this.walls[2]) {
            line(x, y + wid, x + wid, y + wid);
        }
        if (this.walls[3]) {
            line(x, y, x, y + wid);
        }

        if (this.dead) {
            noStroke();
            fill(115, 15, 215);
            rect(x + 1, y + 1, wid, wid);
        } else if (this.visited) {
            noStroke();
            fill(255, 5, 155);
            rect(x + 1, y + 1, wid, wid);
        }
    }
}

function removeWalls(a, b) {
    var x = a.hor - b.hor;
    if (x === 1) {
        a.walls[3] = false;
        b.walls[1] = false;
    } else if (x === -1) {
        a.walls[1] = false;
        b.walls[3] = false;
    }

    var y = a.ver - b.ver;
    if (y === 1) {
        a.walls[0] = false;
        b.walls[2] = false;
    } else if (y === -1) {
        a.walls[2] = false;
        b.walls[0] = false;
    }
}

function wikiSteps() {
    for (i = 0; i < grid.length; i++) {
        grid[i].makeWalls();
    }

    current.visited = true;
    var next = current.checkNeighbors();
    if (next) {
        next.visited = true;
        stack.push(current);
        removeWalls(current, next);
        current = next;
    } else if (stack.length > 0) {
        dead = stack.pop();
        deadend = current;
        current = dead;
        dead.dead = true;
        deadend.dead = true;
    } else if (!mazeGenerated) {
        // Maze is done generating
        mazeGenerated = true;
        document.getElementById('timer').style.display = 'block';
        document.getElementById('status').style.display = 'block';
    }
}