import Sphere from "./sphere.ts";
import PointLight from "./light.ts";
import Tuple, {black, colour, point} from "./tuple.ts";
import {scaling} from "./transformations.ts";
import Intersections from "./intersections.ts";
import Ray from "./ray.ts";
import {Computations} from "./intersection.ts";

export default class World {
    constructor(public objects: Sphere[] = [], public light: PointLight = new PointLight(point(0, 0, 0), colour(1, 1, 1))) {
    }

    intersect(r: Ray): Intersections {
        return new Intersections(
            ...this.objects.flatMap(obj => obj.intersect(r))
                .sort((a, b) => a.t - b.t));
    }

    hitShade(comps: Computations): Tuple {
        return comps.object.material.lighting(this.light, comps.overPoint, comps.eyeV, comps.normalV, this.isShadowed(comps.overPoint));
    }

    colorAt(r: Ray): Tuple {
        const hit = this.intersect(r).hit();
        return hit ? this.hitShade(hit.prepareComputations(r)) : black();
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
    s1.material.color = colour(0.8, 1.0, 0.6);
    s1.material.diffuse = 0.7;
    s1.material.specular = 0.2;
    const s2 = new Sphere();
    s2.transform = scaling(0.5, 0.5, 0.5);
    const light = new PointLight(point(-10, 10, -10), colour(1, 1, 1));
    return new World([s1, s2], light);
}