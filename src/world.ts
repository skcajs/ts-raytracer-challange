import Sphere from "./shapes/sphere.ts";
import PointLight from "./light.ts";
import Tuple, {black, makeColor, makePoint, parseColor} from "./tuple.ts";
import {scaling} from "./transformations.ts";
import Intersections from "./intersections.ts";
import Ray, {makeRay} from "./ray.ts";
import {Computations} from "./intersection.ts";
import Shape from "./shapes/shape.ts";

export default class World {
    constructor(public objects: Shape[] = [], public light: PointLight = new PointLight(makePoint(0, 0, 0), makeColor(1, 1, 1))) {
    }

    intersect(r: Ray): Intersections {
        return new Intersections(
            ...this.objects.flatMap(obj => obj.intersect(r))
                .sort((a, b) => a.t - b.t));
    }

    shadeHit(comps: Computations, depth: number = 1): Tuple {

        const surface = comps.object.material.lighting(comps.object, this.light, comps.overPoint, comps.eyeV, comps.normalV, this.isShadowed(comps.overPoint));

        const reflected = this.reflectedColor(comps, depth);
        const refracted = this.refractedColor(comps, depth);

        const material = comps.object.material;

        if (material.reflective > 0 && material.transparency > 0) {
            const reflectance = comps.schlick;
            return parseColor(surface.add(reflected.multiply(reflectance)).add(refracted.multiply(1 - reflectance)));
        }
        return parseColor(surface.add(reflected).add(refracted));
    }

    reflectedColor(comps: Computations, depth: number = 1): Tuple {
        if (!comps.object.material.reflective) return black();

        if (depth <= 0) return black();

        return parseColor(this.colorAt(makeRay(comps.overPoint, comps.reflectV), depth - 1)
            .multiply(comps.object.material.reflective));
    }

    refractedColor(comps: Computations, depth: number = 1): Tuple {
        if (comps.object.material.transparency == 0 || depth == 0) {
            return black();
        }
        const nRatio = comps.n1 / comps.n2;
        const cosI = comps.eyeV.dot(comps.normalV);
        const sin2t = nRatio ** 2 * (1 - cosI ** 2);
        if (sin2t > 1) return black();

        const cosT = Math.sqrt(1.0 - sin2t);

        const direction = comps.normalV.multiply(nRatio * cosI - cosT).subtract(comps.eyeV.multiply(nRatio));

        const refractRay = makeRay(comps.underPoint, direction);

        return this.colorAt(refractRay, depth - 1).multiply(comps.object.material.transparency);
    }

    colorAt(r: Ray, depth: number = 1): Tuple {
        const xs = this.intersect(r);
        const hit = xs.hit();
        return hit ? this.shadeHit(hit.prepareComputations(r, xs), depth) : black();
    }

    isShadowed(point: Tuple): boolean {
        const distance = this.light.position.subtract(point);
        const hit = this.intersect(new Ray(point, distance.normalize())).hit();

        return !!(hit && hit.t < distance.magnitude());
    }
}

export function emptyWorld() {
    return new World();
}

export function defaultWorld() {
    const s1 = new Sphere();
    s1.material.color = makeColor(0.8, 1.0, 0.6);
    s1.material.diffuse = 0.7;
    s1.material.specular = 0.2;
    const s2 = new Sphere();
    s2.transform = scaling(0.5, 0.5, 0.5);
    const light = new PointLight(makePoint(-10, 10, -10), makeColor(1, 1, 1));
    return new World([s1, s2], light);
}