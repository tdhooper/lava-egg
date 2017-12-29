
var create = function(lut, segments) {
    var cols = segments;
    var rows = lut.length;

    var mesh = {
        positions: [],
        cells: [],
        normals: []
    };

    for (var u = 0; u < cols; u++) {
        for (var v = 0; v < rows; v++) {
            if (v == 0) { continue; }
            if (v == rows - 1) { continue; }
            var angleA = (u / cols) * Math.PI * 2;
            var x = Math.sin(angleA);
            var y = Math.cos(angleA);
            var l = lut[v];
            mesh.positions.push([
                y * l.x,
                l.y,
                x * l.x
            ]);
        }
    }

    mesh.positions.push([0, 0, 0]);
    mesh.positions.push([0, 1, 0]);

    rows -= 2;

    for (var u = 0; u < cols; u++) {
        for (var v = 0; v < rows - 1; v++) {
            var a = u * rows + v;
            var b = ((u + 1) % cols) * rows + v;
            var c = u * rows + v + 1;
            var d = ((u + 1) % cols) * rows + v + 1;
            mesh.cells.push([a, d, b]);
            mesh.cells.push([a, c, d]);
        }
    }

    var end = mesh.positions.length - 1;

    for (var u = 0; u < cols; u++) {
        mesh.cells.push([
            end - 1,
            u * rows,
            ((u + 1) % cols) * rows
        ]);
        mesh.cells.push([
            end,
            ((u + 1) % cols) * rows + rows - 1,
            u * rows + rows - 1
        ]);
    }

    return mesh;
};

module.exports = create;
