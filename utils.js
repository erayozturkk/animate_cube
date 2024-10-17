function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        0.1767767, 0.3061862, -0.3535534, 0,
        -0.2866117, 0.3695995, 0.1767767, 0,
        0.7391989, 0.2803301, 0.6123724, 0,
        0.3, -0.25, 0, 1
    ]);

    return getTransposeMatrix(transformationMatrix);
}




/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    // Helper function to convert degrees to radians
    function degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Convert rotation angles from degrees to radians
    var angleX = degToRad(30);
    var angleY = degToRad(45);
    var angleZ = degToRad(60);

    // Create rotation matrices
    var Rx = createRotationMatrix_X(angleX);
    var Ry = createRotationMatrix_Y(angleY);
    var Rz = createRotationMatrix_Z(angleZ);

    // Create scale matrix (z-scale is 1 since it's not specified)
    var S = createScaleMatrix(0.5, 0.5, 1);

    // Create translation matrix (z-translation is 0)
    var T = createTranslationMatrix(0.3, -0.25, 0);

    // Multiply matrices in the correct order
    var modelViewMatrix = multiplyMatrices(Rx, S);         // Rx * S
    modelViewMatrix = multiplyMatrices(Ry, modelViewMatrix); // Ry * (Rx * S)
    modelViewMatrix = multiplyMatrices(Rz, modelViewMatrix); // Rz * (Ry * (Rx * S))
    modelViewMatrix = multiplyMatrices(T, modelViewMatrix);  // T * (Rz * (Ry * (Rx * S)))

    // Return the model view matrix
    return modelViewMatrix;
}





/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */


function getPeriodicMovement(startTime) {
    // Total duration of the animation in seconds
    var totalTime = 10;

    // Current time in seconds since the start of the animation
    var currentTime = (Date.now() - startTime) / 1000;

    // Time within the current cycle (modulo totalTime to loop the animation)
    var timeInCycle = currentTime % totalTime;

    // Normalize time to range from 0 to 1 for the first half and back to 0 in the second half
    var t;
    if (timeInCycle < 5) {
        t = timeInCycle / 5; // From 0 to 1 over the first 5 seconds
    } else {
        t = (10 - timeInCycle) / 5; // From 1 back to 0 over the next 5 seconds
    }

    // Helper function to convert degrees to radians
    function degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Interpolate rotation angles from 0 to their final values
    var angleX = degToRad(30 * t);
    var angleY = degToRad(45 * t);
    var angleZ = degToRad(60 * t);

    // Interpolate scale factors from 1 to their final values
    var scaleX = 1 + (0.5 - 1) * t; // From 1 to 0.5
    var scaleY = 1 + (0.5 - 1) * t; // From 1 to 0.5
    var scaleZ = 1; // Remains 1 since it's not specified

    // Interpolate translation components from 0 to their final values
    var translateX = 0 + (0.3 - 0) * t;    // From 0 to 0.3
    var translateY = 0 + (-0.25 - 0) * t;  // From 0 to -0.25
    var translateZ = 0; // Remains 0

    // Create rotation matrices
    var Rx = createRotationMatrix_X(angleX);
    var Ry = createRotationMatrix_Y(angleY);
    var Rz = createRotationMatrix_Z(angleZ);

    // Create scale matrix
    var S = createScaleMatrix(scaleX, scaleY, scaleZ);

    // Create translation matrix
    var T = createTranslationMatrix(translateX, translateY, translateZ);

    // Multiply matrices in the same order as before
    var modelViewMatrix = multiplyMatrices(Rx, S);         // Rx * S
    modelViewMatrix = multiplyMatrices(Ry, modelViewMatrix); // Ry * (Rx * S)
    modelViewMatrix = multiplyMatrices(Rz, modelViewMatrix); // Rz * (Ry * (Rx * S))
    modelViewMatrix = multiplyMatrices(T, modelViewMatrix);  // T * (Rz * (Ry * (Rx * S)))

    // Return the interpolated model view matrix
    return modelViewMatrix;
}





