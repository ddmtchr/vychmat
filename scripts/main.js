const dimensionInput = document.querySelector('#dimension')
const approximationsInput = document.querySelector('#approximations')
const precisionInput = document.querySelector('#precision')
const iterationsInput = document.querySelector('#iterations')
const matrix = document.querySelector('#matrix')
const matrixInput = document.querySelector('#matrix-input')
const coefInput = document.querySelector('#coef-input')
const fileInput = document.querySelector('#file-input')
const outputOriginal = document.querySelector('#out-original')
const outputReplaced = document.querySelector('#out-replaced')
const solution = document.querySelector('#out-solution')

dimensionInput.addEventListener('input', toggleMatrix)

precisionInput.addEventListener('input', function() {
    const value = parseFloat(precisionInput.value)
    if (value < 0 || isNaN(value)) precisionInput.value = 0.001
    else if (value > 1) precisionInput.value = 1
})

iterationsInput.addEventListener('input', function() {
    iterationsInput.value = Math.round(iterationsInput.value)
    iterationsInput.value = iterationsInput.value < 1 ? 1 : iterationsInput.value
})

fileInput.addEventListener('change', function() {
    const file = fileInput.files[0]
    const reader = new FileReader()
    reader.onload = function (e) {
        const content = e.target.result
        clearOutput()
        if (!parseFile(content)) {
            let originalLabel = document.createElement('p')
            originalLabel.innerText = 'Неверный формат файла: 4 параметра, матрица, вектор свободных коэффициентов, всё через пробельный символ'
            outputOriginal.appendChild(originalLabel)
        }
    }
    reader.onerror = function(e) {
        console.error('Ошибка чтения файла', e.target.error)
    }
    if (file) {
        reader.readAsText(file)
    }
})

function toggleMatrix() {
    dimensionInput.value = Math.round(dimensionInput.value)
    dimensionInput.value = dimensionInput.value > 20 ? 20 : dimensionInput.value
    if (parseFloat(dimensionInput.value) !== 0 && dimensionInput.value !== '') {
        matrix.style.display = 'block'

        matrixInput.innerHTML = ''
        const dim = parseInt(dimensionInput.value)
        for (let i = 0; i < dim; i++) {
            let row = document.createElement('tr')
            for (let j = 0; j < dim; j++) {
                let cell = createCellWithInput()
                row.appendChild(cell)
            }
            matrixInput.appendChild(row)
        }

        coefInput.innerHTML = ''
        for (let i = 0; i < dim; i++) {
            let row = document.createElement('tr')
            let cell = createCellWithInput()
            row.appendChild(cell)
            coefInput.appendChild(row)
        }
    }
    else if (matrix.style.display === 'block' && (parseFloat(dimensionInput.value) === 0 || dimensionInput.value === '')) {
        matrix.style.display = 'none'
    }
}

function clearInput() {
    let inputs = document.getElementsByTagName('input')
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = ''
    }
    precisionInput.value = 0.001
    iterationsInput.value = 10
}

function clearOutput() {
    outputOriginal.innerHTML = ''
    outputReplaced.innerHTML = ''
    solution.innerHTML = ''
}

function calculate() {
    clearOutput()
    let m = parseMatrix();
    let coefs = parseVector();
    if (!validateFullMatrix(m, coefs)) {
        setOriginal('Матрица и свободные коэффициенты заполнены не полностью', null)
        return
    }

    setOriginal('Исходная матрица:', m)

    const p = findPredominant(m)
    let [replacedMatrix, replacedCoefs] = checkPredominance(m) ? [m, coefs] : replaceRows(m, coefs, p)

    if (!p.includes(-1) && !hasDuplicates(p)) {
        setOutputReplaced('Преобразованная матрица:', replacedMatrix)
    } else {
        setOutputReplaced('Достигнуть диагонального преобладания невозможно. Скорее всего, решение будет неверным', null)
    }

    let [newMatrix, newCoefs] = expressVariables(replacedMatrix, replacedCoefs)
    let x = newCoefs.slice()
    if (approximationsInput.value !== '' && !isNaN(parseFloat(approximationsInput.value))) {
        for (let i = 0; i < x.length; i++) {
            x[i] = parseFloat(approximationsInput.value)
        }
    }
    const dim = parseInt(dimensionInput.value)
    const precision = parseFloat(precisionInput.value)
    const iterations = parseInt(iterationsInput.value)

    let delta = precision
    let deltas = []
    let currentIter = 0

    while (delta >= precision && currentIter < iterations) {
        let newX = matrixByVector(newMatrix, x)
        newX = sumVectors(newX, newCoefs)
        deltas = []
        for (let i = 0; i < dim; i++) {
            deltas.push(Math.abs(newX[i] - x[i]))
        }
        delta = Math.max(...deltas)
        x = newX.slice()
        currentIter++
    }

    for (let i = 0; i < dim; i++) {
        x[i] = roundByPrecision(x[i], precision)
        deltas[i] = roundByPrecision(deltas[i], precision / 100)
    }

    showSolution(currentIter, iterations, x, deltas)
}

function validateFullMatrix(m, coefs) {
    for (let i = 0; i < m.length; i++) {
        if (m[i].includes(NaN)) return false
    }
    return (!coefs.includes(NaN))
}

function checkPredominance(matrix) {
    const dim = matrix.length
    let strict = 0
    for (let i = 0; i < dim; i++) {
        const diag = Math.abs(matrix[i][i])
        let sum = 0;
        for (let j = 0; j < dim; j++) {
            if (i !== j) {
                sum += Math.abs(matrix[i][j])
            }
        }
        if (diag > sum) strict++
        else if (diag < sum) return false
    }
    return strict > 0
}

function findPredominant(matrix) {
    const dim = matrix.length
    let p = new Array(dim)
    for (let i = 0; i < dim; i++) {
        let sumOfModules = 0
        let maxMod = 0
        let maxIndex = 0
        for (let j = 0; j < dim; j++) {
            sumOfModules += Math.abs(matrix[i][j])
            if (Math.abs(matrix[i][j]) > maxMod) {
                maxMod = Math.abs(matrix[i][j])
                maxIndex = j
            }
        }
        p[i] = (maxMod >= sumOfModules - maxMod) ? maxIndex : -1
    }
    return p
}

function replaceRows(matrix, coefs, p) {
    if (p.includes(-1)) return [matrix, coefs]
    const dim = matrix.length
    if (hasDuplicates(p)) return [matrix, coefs]
    let newMatrix = new Array(dim)
    let newCoefs = new Array(dim)
    for (let i = 0; i < dim; i++) {
        newMatrix[p[i]] = matrix[i]
        newCoefs[p[i]] = coefs[i]
    }
    return [newMatrix, newCoefs]
}

function expressVariables(matrix, coefs) {
    const dim = matrix.length
    let newMatrix = []
    let newCoefs = []
    for (let i = 0; i < dim; i++) {
        let row = []
        for (let j = 0; j < dim; j++) {
            if (i !== j) {
                row.push(matrix[i][j] / -matrix[i][i])
            } else {
                row.push(0)
            }
        }
        newMatrix.push(row)
        newCoefs.push(coefs[i] / matrix[i][i])
    }
    return [newMatrix, newCoefs]
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

function roundByPrecision(number, p) {
    const k = 1 / p
    const afterPoint = -Math.log10(p)
    return parseFloat((Math.round(number * k) / k).toFixed(afterPoint))
}

function parseFile(text) {
    const parsed = text.trim().split(/\s+/)
    for (let i = 0; i < parsed.length; i++) {
        if (isNaN(parseFloat(parsed[i]))) return false
    }
    const dim = parseFloat(parsed[0])
    if (parsed.length !== 4 + dim * (dim + 1)) return false
    dimensionInput.value = dim
    approximationsInput.value = parseInt(parsed[1])
    precisionInput.value = parseFloat(parsed[2])
    iterationsInput.value = parseInt(parsed[3])
    toggleMatrix()

    const offset = 4
    let matrixInputs = document.querySelectorAll('#matrix-input input')
    let matrixInputsList = [...matrixInputs]
    for (let i = 0; i < dim * dim; i++) {
        matrixInputsList[i].value = parseFloat(parsed[i + offset])
    }

    let coefInputs = document.querySelectorAll('#coef-input input')
    let coefInputsList = [...coefInputs]
    for (let i = 0; i < dim; i++) {
        coefInputsList[i].value = parseFloat(parsed[i + dim * dim + offset])
    }
    return true
}

function parseMatrix() {
    const dim = parseInt(dimensionInput.value)
    let m = []
    let inputs = document.querySelectorAll('#matrix-input input')
    let inputsList = [...inputs]
    for (let i = 0; i < dim; i++) {
        let row = []
        for (let j = 0; j < dim; j++) {
            row.push(parseFloat(inputsList[i * dim + j].value))
        }
        m.push(row)
    }
    return m
}

function parseVector() {
    const dim = parseInt(dimensionInput.value)
    let vec = []
    let inputs = document.querySelectorAll('#coef-input input')
    let inputsList = [...inputs]
    for (let i = 0; i < dim; i++) {
        vec.push(parseFloat(inputsList[i].value))
    }
    return vec
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

function hasDuplicates(arr) {
    return arr.length !== new Set(arr).size
}

function createCellWithInput() {
    let cell = document.createElement('td')
    let input = document.createElement('input')
    input.type = 'number'
    input.addEventListener('focus', () => input.select())
    cell.appendChild(input)
    return cell
}

function setOriginal(message, matrix) {
    let originalLabel = document.createElement('p')
    originalLabel.innerText = message
    outputOriginal.appendChild(originalLabel)
    if (matrix !== null) outputOriginal.appendChild(matrixToHTML(matrix))
}

function setOutputReplaced(message, matrix) {
    let replacedLabel = document.createElement('p')
    replacedLabel.innerText = message
    outputReplaced.appendChild(replacedLabel)
    if (matrix !== null) outputReplaced.appendChild(matrixToHTML(matrix))
}

function showSolution(currentIter, iterations, x, deltas) {
    if (currentIter === iterations) {
        let solutionLabel = document.createElement('p')
        solutionLabel.innerText = 'Решение не найдено с требуемой точностью (расходящийся процесс или мало итераций)'
        solution.appendChild(solutionLabel)
    } else {
        let solutionLabel = document.createElement('p')
        let errorsLabel = document.createElement('p')
        solutionLabel.innerText = `Решение (итераций: ${currentIter}):`
        errorsLabel.innerText = 'Погрешности:'
        solution.appendChild(solutionLabel)
        solution.appendChild(vectorToHTML(x))
        solution.appendChild(errorsLabel)
        solution.appendChild(vectorToHTML(deltas))
    }
}
