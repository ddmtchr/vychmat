function derivative(f, x0) {
    const h = 0.001
    return (f(x0 + h) - f(x0 - h)) / (2 * h)
}

function derivativeX(f, x0, y0) {
    const h = 0.001
    return (f(x0 + h, y0) - f(x0, y0)) / h
    // return (f(x0 + h, y0) - f(x0 - h, y0)) / (2 * h) // ??
}

function derivativeY(f, x0, y0) {
    const h = 0.001
    return (f(x0, y0 + h) - f(x0, y0)) / h
    // return (f(x0, y0 + h) - f(x0, y0 - h)) / (2 * h) // ??
}

function secondDerivative(f, x0) {
    const h = 0.001
    return (f(x0 + h) - 2 * f(x0) + f(x0 - h)) / (h * h)
}

function findMinOnInterval(f, a, b, precision) {
    while (b - a > 2 * precision) {
        let x1 = (a + b - precision) / 2;
        let x2 = (a + b + precision) / 2;
        if (f(x1) <= f(x2)) b = x2
        else a = x1
    }
    return f((a + b) / 2)
}

function findMaxOnInterval(f, a, b, precision) {
    while (b - a > 2 * precision) {
        let x1 = (a + b - precision) / 2;
        let x2 = (a + b + precision) / 2;
        if (f(x1) >= f(x2)) b = x2
        else a = x1
    }
    return f((a + b) / 2)
}

function Phi(x, lambda, f) {
    return x + lambda * f(x)
}

function PhiDerivative(x, lambda, f) {
    return 1 + lambda * derivative(f, x)
}

function inverse2Matrix(matrix) {
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]
    return [[1 / det * matrix[1][1], 1 / det * -matrix[0][1]], [1 / det * -matrix[1][0], 1 / det * matrix[0][0]]]
}

function matrixByVector(matrix, vector) {
    const dim = matrix.length
    let newVector = []
    for (let i = 0; i < dim; i++) {
        let s = 0;
        for (let j = 0; j < dim; j++) {
            s += matrix[i][j] * vector[j]
        }
        newVector.push(s)
    }
    return newVector
}

function sumVectors(v1, v2) {
    const dim = v1.length
    let newVector = []
    for (let i = 0; i < dim; i++) {
        newVector.push(v1[i] + v2[i])
    }
    return newVector
}

function subVectors(v1, v2) {
    const dim = v1.length
    let newVector = []
    for (let i = 0; i < dim; i++) {
        newVector.push(v1[i] - v2[i])
    }
    return newVector
}

function roundByPrecision(number, p) {
    const k = 1 / p
    const afterPoint = -Math.log10(p)
    return parseFloat((Math.round(number * k) / k).toFixed(afterPoint))
}

function matrixToHTML(matrix) {
    let table = document.createElement('table')
    const dim = matrix.length
    for (let i = 0; i < dim; i++) {
        let row = document.createElement('tr')
        for (let j = 0; j < dim; j++) {
            let cell = document.createElement('td')
            cell.innerText = matrix[i][j]
            row.appendChild(cell)
        }
        table.appendChild(row)
    }
    return table
}

function vectorToHTML(vector) {
    let table = document.createElement('table')
    const dim = vector.length
    for (let i = 0; i < dim; i++) {
        let row = document.createElement('tr')
        let cell = document.createElement('td')
        cell.innerText = vector[i]
        row.appendChild(cell)
        table.appendChild(row)
    }
    return table
}
