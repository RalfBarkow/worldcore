import { Pawn, GetPawn } from "./Pawn";
import { Actor } from "./Actor";
import { mix } from "./Mixins";


//------------------------------------------------------------------------------------------
//-- AM_PointerTarget ----------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Add to an actor to have it handle card pointer events.

export const AM_PointerTarget = superclass => class extends superclass {
    init(options) {
        super.init(options);
        this.hovered = new Set();
        this.focused = new Set();
        this.listen("pointerEnter", this.pointerEnter);
        this.listen("pointerLeave", this.pointerLeave);
        this.listen("focus", this.focus);
        this.listen("blur", this.blur);

    }

    get isMultiuser() { return this._multiuser; }

    pointerEnter(pointerId) {
        this.hovered.add(pointerId)
    }

    pointerLeave(pointerId) {
        this.hovered.delete(pointerId)
    }

    focus(pointerId) {
        if (this.focused.has(pointerId)) return;
        if (!this.isMultiuser && this.focused.size > 0) {
            this.say("focusFailure", {pointerId, });
            return;
        }
        this.focused.add(pointerId)
        this.say("focusSuccess", pointerId)
        console.log(this.focused);
    }

    blur(actorId) {
        this.focused.delete(actorId)
    }

    // onPointerDown()
    // onPointerUp

}

//------------------------------------------------------------------------------------------
//-- PM_PointerTarget ----------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Add to a pawn to have it be targeted by PM_Pointer

export const PM_PointerTarget = superclass => class extends superclass {

    constructor(...args) {
        super(...args);
        this.listen("pointerDown", this.onPointerDown);
        this.listen("pointerUp", this.onPointerUp);
        this.listen("pointerMove", this.onPointerMove);
        this.listen("pointerOver", this.onPointerOver);
        this.listen("pointerDown", this.onPointerUp);
        this.listen("pointerEnter", this.onPointerEnter);
        this.listen("pointerLeave", this.onPointerLeave);
        this.listen("focusSuccess", this.onFocusSuccess);
        this.listen("focusFailure", this.onFocusFailure);
        this.listen("blur", this.onBlur);
    }

    get isMultiuser() {
        return this.actor.isMultiuser;
    }

    onPointerDown(pe) {
    }

    onPointerUp(pe) {
    }

    onPointerMove(pe) {
    }

    onPointerOver(pe) {
    }

    onPointerEnter(actorId) {
    }

    onPointerLeave(actorId) {
    }

    onFocusSuccess(pointerId) {
        const pointerPawn = GetPawn(pointerId);
        if (pointerPawn) pointerPawn.focusPawn = this;
        console.log("onFocusSuccess");
    }

    onFocusFailure(pointerId) {
        const pointerPawn = GetPawn(pointerId);
        if (pointerPawn) pointerPawn.focusPawn = this;
        console.log("onFocusFail");
    }

    onBlur(pointerId) {
        console.log("onBlur");
    }

}

//------------------------------------------------------------------------------------------
//-- PM_Pointer ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Add to an avatar to allow it to use card pointer events.
// Requires the ThreeCamera raycaster.

export const PM_Pointer = superclass => class extends superclass {

    constructor(...args) {
        super(...args);
        if (this.isMyPlayerPawn) {

            this.hoverPawn = null;
            this.focusPawn = null;
            this.focusTime = this.now();
            this.idleTimeout = 5000;

            this.future(0).focusTick();

            if (this.service("UIManager")) {
                this.subscribe("ui", "pointerDown", this.doPointerDown);
                this.subscribe("ui", "pointerUp", this.doPointerUp);
                this.subscribe("ui", "pointerMove", this.doPointerMove);
            }
            else {
                this.subscribe("input", "pointerDown", this.doPointerDown);
                this.subscribe("input", "pointerUp", this.doPointerUp);
                this.subscribe("input", "pointerMove", this.doPointerMove);
            }
        }
    }

    destroy() {
        super.destroy();
        if (this.hoverPawn) this.hoverPawn.say("pointerLeave", this.actor.id);
        if (this.focusPawn) this.focusPawn.say("blur", this.actor.id);
    }

    focusTick() {
        if (this.focusPawn && this.now() > this.focusTime + thisIdleTimeout) this.focusPawn.say("blur", this.actor.id);
        if (!this.doomed) this.future(1000).focusTick();
    }

    doPointerDown(e) {
        this.focusTimeout = this.now();
        console.log(this.actor.id);
        const x = ( e.xy[0] / window.innerWidth ) * 2 - 1;
        const y = - ( e.xy[1] / window.innerHeight ) * 2 + 1;
        const rc = this.pointerRaycast([x,y]);
        rc.pointerId = this.actor.id;
        if (this.focusPawn && this.focusPawn !== rc.pawn) {
            this.focusPawn.say("blur", this.actor.id);
            this.focusPawn = null;
        }
        if (rc.pawn) {
            rc.pawn.say("focus", this.actor.id)
            rc.pawn.say("pointerDown", rc)
        }
    };

    doPointerUp(e) {
        const x = ( e.xy[0] / window.innerWidth ) * 2 - 1;
        const y = - ( e.xy[1] / window.innerHeight ) * 2 + 1;
        const rc = this.pointerRaycast([x,y]);
        rc.pointerId = this.actor.id;
        if (this.focusPawn) this.focusPawn.say("pointerUp,", rc)
    };

    doPointerMove(e) {
        this.focusTimeout = this.now();
        const x = ( e.xy[0] / window.innerWidth ) * 2 - 1;
        const y = - ( e.xy[1] / window.innerHeight ) * 2 + 1;
        const rc = this.pointerRaycast([x,y]);
        rc.pointerId = this.actor.id;
        if (this.hoverPawn !== rc.pawn) {
            if (this.hoverPawn) this.hoverPawn.say("pointerLeave", this.actor.id)
            this.hoverPawn = rc.pawn;
            if (this.hoverPawn) this.hoverPawn.say("pointerEnter", this.actor.id)
        }
        if (this.hoverPawn) this.hoverPawn.say("pointerOver", rc);
        if (this.focusPawn) this.focusPawn.say("pointerMove", rc);
    }

}

//------------------------------------------------------------------------------------------
//-- CardActor ------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class CardActor extends mix(Actor).with(AM_PointerTarget) {

    get pawn() { return CardPawn; }

}
CardActor.register('CardActor');

//------------------------------------------------------------------------------------------
//-- CardPawn ------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class CardPawn extends Pawn {

}