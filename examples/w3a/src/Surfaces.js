import { ModelService, Constants } from "@croquet/worldcore";
import { packKey, unpackKey, Voxels } from "./Voxels";

//------------------------------------------------------------------------------------------
//-- Surface -------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class Surface {
    constructor(key) {
        this.xyz = unpackKey(key);
        this.key = key;
        this.floor = 0;
        this.ceiling = 0;
        this.faces = [0,0,0,0,0,0];
        this.ramps = [0,0,0,0];
        this.doubles = [0,0,0,0];
        this.caps = [0,0,0,0];
        this.sides = [0,0,0,0];
        this.shims = [0,0,0,0];
    }

    get west() { return this.faces[0]; }
    get south() { return this.faces[1]; }
    get east() { return this.faces[2]; }
    get north() { return this.faces[3]; }
    get below() { return this.faces[4]; }
    get above() { return this.faces[5]; }

    get hasFace() { return this.faces.some(e => e)}
    get hasRamp() { return this.ramps.some(e => e)}
    get hasDouble() {return this.doubles.some(e => e)}
    get hasCap() {return this.caps.some(e => e)}
    get hasSide() {return this.sides.some(e => e)}
    get hasShim() {return this.shims.some(e => e)}
    get isEmpty() { return !(this.floor || this.ceiling || this.hasFace || this.hasRamp || this.hasDouble || this.hasCap || this.hasSide || this.hasShim); }

    elevation(x,y) {
        const xx = 1-x;
        const yy = 1-y
        if (this.ramps[0]) return xx;
        if (this.ramps[1]) return yy;
        if (this.ramps[2]) return x;
        if (this.ramps[3]) return y;

        if (this.doubles[0]) return Math.min(1, xx+yy);
        if (this.doubles[1]) return Math.min(1, x+yy);
        if (this.doubles[2]) return Math.min(1, x+y);
        if (this.doubles[3]) return Math.min(1, xx+y);

        if (this.shims[0]) return Math.max(0, -1 + xx+yy);
        if (this.shims[1]) return Math.max(0, -1 + x+yy);
        if (this.shims[2]) return Math.max(0, -1 + x+y);
        if (this.shims[3]) return Math.max(0, -1 + xx+y);

        return 0;

    }

    findFaces(voxels) {
        voxels.forAdjacent(...this.xyz, (d,x,y,z,t) => {
            if(t<2) return;
            this.faces[d] = t
            this.sides[d] = t;
            this.floor = this.below;
            this.ceiling = this.above;
        });
    }

    findRamps(voxels) {

        // No floor or low ceiling = no ramp
        if (!this.below || this.above|| this.below == Constants.lava) return;

        // Add a ramp if there's a face opposite a non-face.

        if (this.west && !this.east) this.ramps[0] = this.below;
        if (this.south && !this.north) this.ramps[1] = this.below;
        if (this.east && !this.west) this.ramps[2] = this.below;
        if (this.north && !this.south) this.ramps[3] = this.below;

        // No ramps to nowhere -- ramps must lead up to empty voxels

        if (this.ramps[0]) {
            const adjacent = Voxels.adjacent(...this.xyz, [-1,0,1]);
            if (Voxels.isValid(...adjacent) && voxels.get(...adjacent)) this.ramps[0] = 0
        };

        if (this.ramps[1]) {
            const adjacent = Voxels.adjacent(...this.xyz, [0,-1,1]);
            if (Voxels.isValid(...adjacent) && voxels.get(...adjacent)) this.ramps[1] = 0
        };

        if (this.ramps[2]) {
            const adjacent = Voxels.adjacent(...this.xyz, [1,0,1]);
            if (Voxels.isValid(...adjacent) && voxels.get(...adjacent)) this.ramps[2] = 0
        };

        if (this.ramps[3]) {
            const adjacent = Voxels.adjacent(...this.xyz, [0,1,1]);
            if (Voxels.isValid(...adjacent) && voxels.get(...adjacent)) this.ramps[3] = 0
        };

        // Find double ramps (Test that bottom corner of a double doesn't face a solid voxel.)

        if (this.ramps[0] && this.ramps[1]) {
            this.doubles[0] = this.below;
        }

        if (this.ramps[1] && this.ramps[2]) {
            this.doubles[1] = this.below;
        }

        if (this.ramps[2] && this.ramps[3]) {
            this.doubles[2] = this.below;
        }

        if (this.ramps[3] && this.ramps[0]) {
            this.doubles[3] = this.below;
        }

        // Eliminate doubles where the bottom corner points to a solid voxel

        if (this.doubles[0]) {
            const corner = Voxels.adjacent(...this.xyz, [1,1,0]);
            if (Voxels.isValid(...corner) && voxels.get(...corner)){
                this.doubles[0] = 0
                this.ramps[0] = 0;
                this.ramps[1] = 0;
            }
        }

        if (this.doubles[1]) {
            const corner = Voxels.adjacent(...this.xyz, [-1,1,0]);
            if (Voxels.isValid(...corner) && voxels.get(...corner)){
                this.doubles[1] = 0
                this.ramps[1] = 0;
                this.ramps[2] = 0;
            }
        }

        if (this.doubles[2]) {
            const corner = Voxels.adjacent(...this.xyz, [-1,-1,0]);
            if (Voxels.isValid(...corner) && voxels.get(...corner)){
                this.doubles[2] = 0
                this.ramps[2] = 0;
                this.ramps[3] = 0;
            }
        }

        if (this.doubles[3]) {
            const corner = Voxels.adjacent(...this.xyz, [1,-1,0]);
            if (Voxels.isValid(...corner) && voxels.get(...corner)){
                this.doubles[3] = 0
                this.ramps[2] = 0;
                this.ramps[0] = 0;
            }
        }
    }

    findCaps(voxels, surfaces, secondary) {
        if (!this.hasDouble) return false;
        const aboveXYZ = Voxels.adjacent(...this.xyz, [0,0,1]);
        if (!Voxels.isValid(...aboveXYZ)) return;
        const aboveKey = packKey(...aboveXYZ);
        const above = surfaces.get(aboveKey);
        surfaces.surfaces.set(aboveKey, above);
        secondary.add(aboveKey);
        above.caps = [...this.doubles];
    }

    findSides(voxels, surfaces, secondary) {

        if (this.ramps[0]) {
            const leftXYZ = Voxels.adjacent(...this.xyz, [0,-1,0]);
            const rightXYZ = Voxels.adjacent(...this.xyz, [0,1,0]);

            if (Voxels.isValid(...leftXYZ) && voxels.get(...leftXYZ)<2) {
                const leftKey = packKey(...leftXYZ);
                let left = surfaces.get(leftKey);
                surfaces.surfaces.set(leftKey, left);
                secondary.add(leftKey);
                left.faces[3] = this.below;
                left.sides[3] = 1;
            }

            if (Voxels.isValid(...rightXYZ) && voxels.get(...rightXYZ)<2){
                const rightKey = packKey(...rightXYZ);
                let right = surfaces.get(rightKey);
                surfaces.surfaces.set(rightKey, right);
                secondary.add(rightKey);
                right.faces[1] = this.below;
                right.sides[1] = 2;
            }

        }

        if (this.ramps[1]) {
            const leftXYZ = Voxels.adjacent(...this.xyz, [-1,0,0]);
            const rightXYZ = Voxels.adjacent(...this.xyz, [1,0,0]);

            if (Voxels.isValid(...leftXYZ) && voxels.get(...leftXYZ)<2) {
                const leftKey = packKey(...leftXYZ);
                let left = surfaces.get(leftKey);
                surfaces.surfaces.set(leftKey, left);
                secondary.add(leftKey);
                left.faces[2] = this.below;
                left.sides[2] = 2;
            }

            if (Voxels.isValid(...rightXYZ) && voxels.get(...rightXYZ)<2){
                const rightKey = packKey(...rightXYZ);
                let right = surfaces.get(rightKey);
                surfaces.surfaces.set(rightKey, right);
                secondary.add(rightKey);
                right.faces[0] = this.below;
                right.sides[0] = 1;
            }
        }

        if (this.ramps[2]) {
            const leftXYZ = Voxels.adjacent(...this.xyz, [0,-1,0]);
            const rightXYZ = Voxels.adjacent(...this.xyz, [0,1,0]);

            if (Voxels.isValid(...leftXYZ) && voxels.get(...leftXYZ)<2) {
                const leftKey = packKey(...leftXYZ);
                let left = surfaces.get(leftKey);
                surfaces.surfaces.set(leftKey, left);
                secondary.add(leftKey);
                left.faces[3] = this.below;
                left.sides[3] = 2;
            }

            if (Voxels.isValid(...rightXYZ) && voxels.get(...rightXYZ)<2){
                const rightKey = packKey(...rightXYZ);
                let right = surfaces.get(rightKey);
                surfaces.surfaces.set(rightKey, right);
                secondary.add(rightKey);
                right.faces[1] = this.below;
                right.sides[1] = 1;
            }
        }

        if (this.ramps[3]) {
            const leftXYZ = Voxels.adjacent(...this.xyz, [-1,0,0]);
            const rightXYZ = Voxels.adjacent(...this.xyz, [1,0,0]);

            if (Voxels.isValid(...leftXYZ) && voxels.get(...leftXYZ)<2) {
                const leftKey = packKey(...leftXYZ);
                let left = surfaces.get(leftKey);
                surfaces.surfaces.set(leftKey, left);
                secondary.add(leftKey);
                left.faces[2] = this.below;
                left.sides[2] = 1;
            }

            if (Voxels.isValid(...rightXYZ) && voxels.get(...rightXYZ)<2){
                const rightKey = packKey(...rightXYZ);
                let right = surfaces.get(rightKey);
                surfaces.surfaces.set(rightKey, right);
                secondary.add(rightKey);
                right.faces[0] = this.below;
                right.sides[0] = 2;
            }
        }

    }

    findShims() {
        if (this.floor) {
            if (this.sides[0] == 1  && this.sides[1] ==2) this.shims[0] = this.floor;
            if (this.sides[1] == 1  && this.sides[2] ==2) this.shims[1] = this.floor;
            if (this.sides[2] == 1 && this.sides[3] ==2) this.shims[2] = this.floor;
            if (this.sides[3] == 1 && this.sides[0] ==2) this.shims[3] = this.floor;
        }
        if (this.caps[0] && this.sides[0] == 1  && this.sides[1] == 2) this.shims[0] = this.caps[0];
        if (this.caps[1] && this.sides[1] == 1  && this.sides[2] == 2) this.shims[1] = this.caps[1];
        if (this.caps[2] && this.sides[2] == 1 && this.sides[3] == 2) this.shims[2] = this.caps[2];
        if (this.caps[3] && this.sides[3] == 1 && this.sides[0] == 2) this.shims[3] = this.caps[3];
    }

    cullUnderRamps() {}
    cullUnderDoubles() {}
    cullUnderShims(){}
    cullDuplicateSides(surfaces){}

}

//------------------------------------------------------------------------------------------
//-- Surfaces ------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class Surfaces extends ModelService {

    static types() {
        return { "W3:Surface": Surface };
    }

    init() {
        super.init('Surfaces');
        this.surfaces = new Map();

        this.subscribe("voxels", "load", this.rebuildAll)
        this.subscribe("voxels", "set", this.rebuildAll)
    }

    elevation(x,y,z) {
        const xx = Math.floor(x);
        const yy = Math.floor(y);
        const zz = Math.floor(z);
        const key = packKey(xx,yy,zz);
        const s = this.get(key);
        if (!s) return undefined;
        return s.elevation(x-xx, y-yy);
    }

    get(key) {
        return this.surfaces.get(key) || new Surface(key);
        // return this.surfaces.get(key) ;
    }

    add(key) {
        const s = new Surface(key);
        this.surfaces.set(key,s);
        return s;
    }

    rebuildAll() {
        this.surfaces = new Map();

        const voxels = this.service("Voxels");
        const primary = new Set();
        const secondary = new Set();

        // Build primary set
        voxels.forEach((x,y,z,t)=> {
            if (t>=2) return;
            const key = packKey(x,y,z);
            voxels.forAdjacent(x,y,z, (d,x,y,z,t) => {
                if (t<2) return;
                this.add(key) // xxx
                primary.add(key);
            })
        });

        primary.forEach(key => { this.get(key).findFaces(voxels) });
        primary.forEach(key => { this.get(key).findRamps(voxels); });
        primary.forEach(key => { this.get(key).findCaps(voxels,this,secondary) });
        primary.forEach(key => { this.get(key).findSides(voxels,this,secondary)});
        secondary.forEach(key => {this.get(key).findShims();});

        // Cull floor & sides under ramps

        primary.forEach(key => {
            const s = this.get(key);
            if (s.ramps[0]) {s.sides[0] = 0; s.floor = 0};
            if (s.ramps[1]) {s.sides[1] = 0; s.floor = 0};
            if (s.ramps[2]) {s.sides[2] = 0; s.floor = 0};
            if (s.ramps[3]) {s.sides[3] = 0; s.floor = 0};
        });

        // Cull double sides

        secondary.forEach ( key => {
            const s = this.get(key);
            const xyz = unpackKey(key);

            if (s.sides[0]){
                const aXYZ = Voxels.adjacent(...xyz, [-1,0,0]);
                const aKey = packKey(...aXYZ);
                if (secondary.has(aKey)) {
                    const a = this.get(aKey);
                    if (s.sides[0] == 1 && a.sides[2] == 2 || s.sides[0] == 2 && a.sides[2] == 1) { s.sides[0] = 0; a.sides[2] = 0 };
                }
            }

            if (s.sides[1]){
                const aXYZ = Voxels.adjacent(...xyz, [0,-1,0]);
                const aKey = packKey(...aXYZ);
                if (secondary.has(aKey)) {
                    const a = this.get(aKey);
                    if (s.sides[1] == 1 && a.sides[3] == 2 || s.sides[1] == 2 && a.sides[3] == 1) { s.sides[1] = 0; a.sides[3] = 0 };
                }
            }
        })

        // Cull caps & sides under shims

        secondary.forEach(key => {
            const s = this.get(key);
            if (s.shims[0]) { s.caps[0] = 0; s.sides[0] = 0; s.sides[1] = 0;};
            if (s.shims[1]) { s.caps[1] = 0; s.sides[1] = 0; s.sides[2] = 0;};
            if (s.shims[2]) { s.caps[2] = 0; s.sides[2] = 0; s.sides[3] = 0;};
            if (s.shims[3]) { s.caps[3] = 0; s.sides[3] = 0; s.sides[0] = 0;};
        });

        // Cull ramps under doubles

        primary.forEach(key => {
            const s = this.get(key);
            if (s.doubles[0]) { s.ramps[0] = 0; s.ramps[1] = 0;};
            if (s.doubles[1]) { s.ramps[1] = 0; s.ramps[2] = 0;};
            if (s.doubles[2]) { s.ramps[2] = 0; s.ramps[3] = 0;};
            if (s.doubles[3]) { s.ramps[3] = 0; s.ramps[0] = 0;};
        });

        this.publish("surfaces", "rebuildAll");



    }
}
Surfaces.register('Surfaces');