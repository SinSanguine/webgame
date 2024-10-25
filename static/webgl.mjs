import resizeCanvasToDisplaySize from './utils/resize_canvas_to_display_size.mjs';
import create_shader_program from './utils/create_shader_program.mjs';
import create_shader_variable_bindings from './utils/create_shader_variable_bindings.mjs';
import init_players from './players.mjs';
import shader_config from './config/shader_config.mjs';

// Vertex information 

let vertexArray;
let vertexBuffer;
let vertexNumComponents;
let vertexCount;

// Rendering data shared with the
// scalers.
let aVertexPosition;

// Animation timing

const size = 0.1;
const degreesPerSecond = 180.0;
const sync_time = 5;
let previousTime = 0.0;

window.addEventListener("load", startup, false);

async function startup() {
    try {
        
        const glCanvas = document.getElementById("glcanvas");
        if (!glCanvas || !(glCanvas instanceof HTMLCanvasElement))
            throw Error('canvas wrong')
        const gl = glCanvas.getContext("webgl");
        if (!gl)
            throw Error('no webgl context');

        const shader_program= create_shader_program(gl,shader_config);
        const variables = create_shader_variable_bindings(gl,shader_config,shader_program);
        

        /**@type {[number,number]} */
        let currentRotation = [0, 1];

        vertexArray = new Float32Array([
            -size, size, size, size, size, -size, -size, size, size, -size, -size, -size,
        ]);

        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

        vertexNumComponents = 2;
        vertexCount = vertexArray.length / vertexNumComponents;

        let currentAngle = 0.0;
        const {players,me} = await init_players();
        glCanvas.addEventListener('mousemove', (event) => {
            const { width: css_width, height: css_height } = getComputedStyle(glCanvas);
            const { width, height } = { width: Number.parseInt(css_width.slice(0, -1 * 'px'.length)), height: Number.parseInt(css_height.slice(0, -1 * 'px'.length)) };
            players[me] = [
                (event.clientX / width * 2 - 1),
                (-event.clientY / height * 2 + 1)
            ];
        })

        const animateScene = () => {
            resizeCanvasToDisplaySize(glCanvas);
            const { width: css_width, height: css_height } = getComputedStyle(glCanvas);
            const { width, height } = { width: Number.parseInt(css_width.slice(0, -1 * 'px'.length)), height: Number.parseInt(css_height.slice(0, -1 * 'px'.length)) }
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const radians = (currentAngle * Math.PI) / 180.0;
            currentRotation[0] = Math.sin(radians);
            currentRotation[1] = Math.cos(radians);


            variables.vertex_shader.uScalingFactor = [height > width ? 1.0 : height / width, width > height ? 1.0 : width / height];
            variables.vertex_shader.uRotationVector = currentRotation;

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

            aVertexPosition = gl.getAttribLocation(shader_program, "aVertexPosition");

            gl.enableVertexAttribArray(aVertexPosition);
            gl.vertexAttribPointer(
                aVertexPosition,
                vertexNumComponents,
                gl.FLOAT,
                false,
                0,
                0,
            );

            Object.values(players).forEach(position => {
                variables.vertex_shader.u_position_adjust = position;
                gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
            });

            requestAnimationFrame((currentTime) => {
                const deltaAngle =
                    ((currentTime - previousTime) / 1000.0) * degreesPerSecond;

                currentAngle = (currentAngle + deltaAngle) % 360;

                previousTime = currentTime;
                animateScene();
            });
        };
        animateScene();

    } catch (err) {
        console.log(err);
    }
}



