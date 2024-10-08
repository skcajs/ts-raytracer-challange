import Tuple, {black, makeColor, parseColor} from "./tuple.ts";
import PointLight from "./light.ts";
import Pattern from "./patterns/pattern.ts";
import Shape from "./shapes/shape.ts";

export default class Material {
    constructor(public color: Tuple,
                public ambient: number,
                public diffuse: number,
                public specular: number,
                public shininess: number,
                public reflective: number,
                public transparency: number,
                public refractiveIndex: number,
                public pattern?: Pattern) {
    }

    lighting(object: Shape, light: PointLight, point: Tuple, eyeV: Tuple, normalV: Tuple, inShadow: boolean = false): Tuple {
        let diffuse = black();
        let specular = black();

        if (this.pattern) this.color = this.pattern.colorAt(point, object);

        const effectiveColor = this.color.multiplyTuple(light.intensity);
        const lightV = light.position.subtract(point).normalize();
        const ambient = effectiveColor.multiply(this.ambient);

        if (inShadow) {
            return parseColor(ambient);
        }

        const lightDotNormal = lightV.dot(normalV);
        if (lightDotNormal > 0) {
            diffuse = effectiveColor.multiply(this.diffuse).multiply(lightDotNormal);
            const reflectV = lightV.multiply(-1).reflect(normalV);
            const reflectVDotEye = reflectV.dot(eyeV);
            if (reflectVDotEye > 0) {
                const factor = Math.pow(reflectVDotEye, this.shininess);
                specular = light.intensity.multiply(this.specular).multiply(factor);
            }
        }
        return parseColor(ambient.add(diffuse).add(specular));
    }
}

export function material() {
    return new Material(
        makeColor(1, 1, 1),
        0.1,
        0.9,
        0.9,
        200.0,
        0.0,
        0.0,
        1.0);
}

