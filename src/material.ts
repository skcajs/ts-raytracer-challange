import Tuple, {black, colour, parseColor} from "./maths/tuple.ts";
import PointLight from "./light.ts";

export default class Material {
    constructor(public color: Tuple = colour(1, 1, 1),
                public ambient: number = 0.1,
                public diffuse: number = 0.9,
                public specular: number = 0.9,
                public shininess: number = 200.0) {
    }

    lighting(light: PointLight, point: Tuple, eyeV: Tuple, normalV: Tuple, inShadow: boolean = false): Tuple {
        let diffuse = black();
        let specular = black();

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

export function makeMaterial() {
    return new Material();
}

