import { AM_Smoothed, RegisterMixin, v3_sub, v3_add, v3_floor, PM_Smoothed } from "@croquet/worldcore";
import { Voxels } from "./Voxels";

//------------------------------------------------------------------------------------------
//-- VoxelSmoothed -------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// VoxelSmoothed actors exist in a specific voxel in the world. They can be paired with either
// AM_Spatial or AM_VoxelSmoothed pawns.
//
// They hold an xyz value (the voxel coordinates) and a fraction (the offset within the voxel).
// Their world translation is calcuated from these base values. You can also get the voxel key.
//
// In general you want to always work with the xyz & fraction if possible. It's more numerically
// stable. However, if you you set the translation directly or use the default moveTo method, the
// xyz and the fraction will be updated to match.  Do not set the key directly.

//-- Actor ---------------------------------------------------------------------------------

export const AM_VoxelSmoothed = superclass => class extends AM_Smoothed(superclass) {

    init(options) {
        this.listen("_xyz", this.localChanged);
        this.listen("_fraction", this.localChanged);
        this.listen("_translation", this.onTranslation);
        this.listen("_key", this.onKey);
        super.init(options);
    }

    onKey() {
        console.warn("Do not directly set the voxel key of a VoxelSmoothed actor. Set its voxel coordinates instead.");
    }

    onTranslation(data) {
        this.extractVoxelInfo(data.v);
        delete this._translation;
    }

    extractVoxelInfo(translation) {
        const t = Voxels.toVoxelXYZ(...translation);
        this._xyz = v3_floor(t);
        this._fraction = v3_sub(t, this._xyz);
    }

    get xyz() {
        return this._xyz || [0,0,0];
    }

    get key() {
        return Voxels.packKey(...this.xyz)
    }

    get fraction() {
        return this._fraction || [0,0,0];
    }

    get translation() {
        return Voxels.toWorldXYZ(...v3_add(this.xyz, this.fraction));
    }

    voxelMoveTo(xyz, fraction) {
        this._xyz = xyz;
        this._fraction = fraction;
        const v = Voxels.toWorldXYZ(v3_add(this.xyz, this.fraction));
        this.say("moveTo", v);
        this.localChanged();
    }

    moveTo(v) {
        this.extractVoxelInfo(v);
        this.say("moveTo", v);
        this.localChanged();
    }

};
RegisterMixin(AM_VoxelSmoothed);

//-- Pawn ----------------------------------------------------------------------------------

export const PM_VoxelSmoothed = superclass => class extends PM_Smoothed(superclass) {
    constructor(...args) {
        super(...args);
        this.listenOnce("_xyz", d => {this._translation = this.actor.translation; this.localChanged();});
        this.listenOnce("_fraction", d => {this._translation = this.actor.translation; this.localChanged();});
    }

};
