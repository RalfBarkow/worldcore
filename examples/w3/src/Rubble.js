import { Model } from "@croquet/croquet";
import { mix, Actor, Pawn, AM_Smoothed, PM_Smoothed, Material, PM_InstancedVisible, v3_add,
    CachedObject, InstancedDrawCall, AM_Behavioral, Cube, ModelService } from "@croquet/worldcore";
    import { Voxels } from "./Voxels";
import { FallBehavior } from "./SharedBehaviors"
import paper from "../assets/paper.jpg";
import { SideColor } from "./VoxelRender";

export class Rubble extends ModelService {
    init() {
        super.init('Rubble');
        this.subscribe("voxels", "changed", this.onVoxelChange);
    }

    onVoxelChange(data) {
        const xyz = data.xyz;
        const type = data.type;
        const old = data.old;
        if (type || !old) return; // only spawn rubble if a solid voxel becomes air.

        RubbleActor.create({type: old, translation: Voxels.toWorldXYZ(...v3_add(xyz, [0.25, 0.25, 0.5]))});
        RubbleActor.create({type: old, translation: Voxels.toWorldXYZ(...v3_add(xyz, [0.25, 0.75, 0.5]))});
        RubbleActor.create({type: old, translation: Voxels.toWorldXYZ(...v3_add(xyz, [0.75, 0.25, 0.5]))});
        RubbleActor.create({type: old, translation: Voxels.toWorldXYZ(...v3_add(xyz, [0.75, 0.75, 0.5]))});
    }
}
Rubble.register('Rubble');

//------------------------------------------------------------------------------------------
//-- Rubble --------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class RubbleActor extends mix(Actor).with(AM_Smoothed, AM_Behavioral) {
    get pawn() {return RubblePawn}
    init(options) {
        super.init(options);
        this.startBehavior(FallBehavior, {tickRate:50});
    }

    get type() {return this._type};

}
RubbleActor.register("RubbleActor");

export class RubblePawn extends mix(Pawn).with(PM_Smoothed, PM_InstancedVisible) {
    constructor(...args) {
        super(...args);
        this.setDrawCall(CachedObject("rubbleDrawCall"+this.actor.type, () => this.buildDraw()));
    }

    buildDraw() {
        const mesh = CachedObject("rubbleMesh"+this.actor.type, () => this.buildMesh());
        const material = CachedObject("instancedPaperMaterial", this.buildMaterial);
        const draw = new InstancedDrawCall(mesh, material);
        this.service("RenderManager").scene.addDrawCall(draw);
        return draw;
    }

    buildMaterial() {
        const material = new Material();
        material.pass = 'instanced';
        material.texture.loadFromURL(paper);
        return material;
    }

    buildMesh() {
        const color = SideColor(this.actor.type);
        const block = Cube(2,2,2, color);
        block.load();
        block.clear();
        return block;
    }
}