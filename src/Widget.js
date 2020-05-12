import { View } from "@croquet/croquet";
import { v2_sub, v2_multiply, v2_add } from "./Vector";
import { LoadFont, LoadImage} from "./ViewAssetCache";
import { NamedView, GetNamedView } from "./NamedView";

let cc;

//------------------------------------------------------------------------------------------
//-- UI ------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// The UI is the top-level UI manager. It creates the canvas that the UI is drawn on, and catches events
// and passes them to the widget tree.
//
// It re-publishes cursorDown and touchDown events after it's given the UI widgets a chance to intercept
// them.
//
// Takes the device's pixel ratio into account. This can be over-ridden using SetScale.

export class UIManager extends NamedView {

        constructor() {
            super('UIManager');

            this.canvas = document.createElement("canvas");
            this.canvas.id = "UICanvas";
            this.canvas.style.cssText = "position: absolute; left: 0; top: 0; z-index: 1";
            document.body.insertBefore(this.canvas, null);
            cc = this.canvas.getContext('2d');

            this.root = new RootWidget();
            this.resize();

            this.subscribe("input", {event: "resize", handling: "immediate"}, this.resize);
            this.subscribe("input", {event: "mouseXY", handling: "immediate"}, this.mouseXY);
            this.subscribe("input", {event: "mouse0Down", handling: "immediate"}, this.mouse0Down);
            this.subscribe("input", {event: "mouse0Up", handling: "immediate"}, this.mouse0Up);
            // this.subscribe("input", "cursor2Down", data => this.cursor2Down(data));
            // this.subscribe("input", "cursor2Up", data => this.cursor2Up(data));
            this.subscribe("input", {event: "touchXY", handling: "immediate"}, this.touchXY);
            this.subscribe("input", {event: "touchDown", handling: "immediate"}, this.touchDown);
            this.subscribe("input", {event: "touchUp", handling: "immediate"}, this.touchUp);
        }

        destroy() {
            super.detach();
            if (this.root) this.root.destroy();
            this.canvas.remove();
        }

        resize() {
            this.ratio = window.devicePixelRatio;
            console.log("UI Pixel Ratio: " + this.ratio);
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.canvas.style.width = width + "px";
            this.canvas.style.height = height + "px";
            this.canvas.width = width * this.ratio;
            this.canvas.height = height * this.ratio;
            this.size = [width, height];
            if (this.root) this.root.setSize(this.size);
        }

        setRoot(root) {
            this.root = root;
            if (this.root) this.root.setSize(this.size);
        }

        update() {
            cc.setTransform(1, 0, 0, 1, 0, 0);
            cc.scale(this.ratio, this.ratio);
            if (this.root) this.root.update();
        }

        mouseXY(xy) {
            if (this.root) this.root.mouse(xy);
            this.publish("ui", "mouseXY", xy);
        }

        mouse0Down(xy) {
            if (!this.root) return;
            if (!this.root.press(xy)) this.publish("ui", "mouse0Down", xy);
        }

        mouse0Up(xy) {
            if (this.root) this.root.release(xy);
            this.publish("ui", "mouse0Up", xy);
        }

        // cursor2Down(xy) {
        //     if (!this.root) return;
        //     if (!this.root.press(xy)) this.publish("ui", "cursor2Down", xy);
        // }

        // cursor2Up(xy) {
        //     if (this.root) this.root.release(xy);
        //     this.publish("ui", "cursor2Up", xy);
        // }

        touchXY(xy) {
            if (this.root) this.root.touch(xy);
            this.publish("ui", "touchXY", xy);
        }

        touchDown(xy) {
            if (!this.root) return;
            if (!this.root.press(xy)) this.publish("ui", "touchDown", xy);
        }

        touchUp(xy) {
            if (this.root) this.root.release(xy);
            this.publish("ui", "touchUp", xy);
        }

}

//------------------------------------------------------------------------------------------
//-- Widget --------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Base class for all widgets.

export class Widget extends View {

    constructor(parent) {
        super();
        this.children = new Set();
        this.anchor = [0,0];                // xy values from 0-1 specifying origin point in parent
        this.pivot = [0,0];                 // xy value from 0-1 specifying origin point in widget
        this.local = [0,0];                 // Position in pixels of pivot relative to parent's anchor
        this.desiredSize = [100, 100];      // Size in pixels (may be overruled by scale)
        this.autoSize = [0,0];              // Scale to match parent (use _size if 0);
        this.border = [0,0,0,0];            // Left/Top/Right/Bottom inset of content from widget edge
        this.localOpacity = 1;              // Default value
        this.inheritOpacity = true;         // Affected by parent's opacity
        this.consumeEvents = false;         // Intercepts touch or mouse down events.
        this.isChanged = true;
        this.isVisible = true;
        if (parent) parent.addChild(this);
    }

    destroy() {
        super.detach();
        if (this.parent) this.parent.removeChild(this);
        this.children.forEach(child => child.destroy);
    }

    addChild(child) {
        if (child.parent) child.parent.removeChild(child);
        this.children.add(child);
        child.parent = this;
        this.markChanged();
    }

    removeChild(child) {
        this.children.delete(child);
        child.parent = null;
        this.markChanged();
    }

    destroyChild(child) {
        this.removeChild(child);
        child.destroy();
    }

    setAnchor(anchor) {
        this.anchor = anchor;
        this.markChanged();
    }

    setPivot(pivot) {
        this.pivot = pivot;
        this.markChanged();
    }

    setLocal(local) {
        this.local = local;
        this.markChanged();
    }

    setSize(size) {
        this.desiredSize = size;
        this.markChanged();
    }

    setAutoSize(autoSize) {
        this.autoSize = autoSize;
        this.markChanged();
    }

    setBorder(border) {
        this.border = border;
        this.markChanged();
    }

    setOpacity(opacity, inherit = true) {
        this.localOpacity = opacity;
        this.inheritOpacity = inherit;
        this.markChanged();
    }

    show() {
        this.isVisible = true;
        this.markAllChanged();
    }

    hide() {
        this.isVisible = false;
        this.markAllChanged();
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.markAllChanged();
    }

    setConsumeEvents(consume) {
        this.consumeEvents = consume;
    }

    markChanged() {
        this.isChanged = true;
        this._size = null;
        this._global = null;
        this._opacity = 0;
        this.children.forEach(child => child.markChanged());
    }

    // Tell the UI to redraw the whole screen
    // This is used for show/hide widget events
    markAllChanged() {
        const ui = GetNamedView('UI');
        if (ui && ui.root) ui.root.markChanged();
    }

    // Returns the size of the drawable area
    get size() {
        if (this._size) return this._size;
        this._size = [...this.desiredSize];
        if (this.parent && (this.autoSize[0] || this.autoSize[1])) {
            const parentSize = this.parent.size;
            if (this.autoSize[0]) this._size[0] = parentSize[0] * this.autoSize[0];
            if (this.autoSize[1]) this._size[1] = parentSize[1] * this.autoSize[1];
        }
        this._size[0] -= (this.border[0] + this.border[2]);
        this._size[1] -= (this.border[1] + this.border[3]);
        return this._size;
    }

    // Returns the upper left corner in global coordinates
    get global() {
        if (this._global) return this._global;
        if (!this.parent) return this.local;
        const anchor = v2_add(this.parent.global, v2_multiply(this.parent.size, this.anchor));
        const ulBorder = [this.border[0], this.border[1]];
        this._global = v2_add(ulBorder, v2_add(this.local, v2_sub(anchor, v2_multiply(this.size, this.pivot))));
        return this._global;
    }

    get opacity() {
        if (this._opacity ) return this._opacity;
        if (!this.parent || !this.inheritOpacity) return this.localOpacity;
        this._opacity = this.localOpacity * this.parent.opacity;
        return this._opacity;
    }

    inRect(xy) {
        const x = xy[0];
        const y = xy[1];
        const global = this.global;
        const size = this.size;
        if (x < global[0] || x > (global[0] + size[0])) return false;
        if (y < global[1] || y > (global[1] + size[1])) return false;
        return true;
     }


    update() {
        if (this.isChanged) this.drawWithOpacity();
        this.isChanged = false;
        if (this.isVisible) this.children.forEach(child => child.update());
    }

    mouse(xy) {
        this.children.forEach(child => child.mouse(xy));
    }

    touch(xy) {
        this.children.forEach(child => child.touch(xy));
    }

    press(xy) {
        if (!this.isVisible || !this.inRect(xy)) return false;
        let consumed = false;
        this.children.forEach(child => consumed = child.press(xy) || consumed);
        return this.consumeEvents || consumed;
    }

    release(xy) {
        this.children.forEach(child => child.release(xy));
    }

    drawWithOpacity() {
        if (!this.isVisible) return;
        if (this.opacity < 1) {
            cc.globalCompositeOperation = 'destination-out';
            cc.globalAlpha = 1;
            this.draw();
        }
        cc.globalCompositeOperation = 'source-over';
        cc.globalAlpha = this.opacity;
        cc.lineWidth = 1;
        this.draw();
    }

    clear() {
        const xy = this.global;
        const size = this.size;
        cc.clearRect(xy[0], xy[1], size[0], size[1]);
    }

    draw() {}

    //Converts RGB to a canvas-friendly string
    static color(r, g, b) {
        return 'rgba(' + Math.floor(255 * r) + ', ' + Math.floor(255 * g) + ', ' + Math.floor(255 * b) + ', ' + 1 +')';
    }
}

//------------------------------------------------------------------------------------------
//-- RootWidget ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// The root of the widget tree. Clears the screen on redraw.

export class RootWidget extends Widget {

    draw() {
        const xy = this.global;
        const size = this.size;
        cc.clearRect(xy[0], xy[1], size[0], size[1]);
    }

}

//------------------------------------------------------------------------------------------
//-- BoxWidget -----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Draws an area filled with a solid color.

export class BoxWidget extends Widget {
    constructor(parent) {
        super(parent);
        this.color = [0.5,0.5,0.5];
    }

    setColor(color) {
        this.color = color;
        this.markChanged();
    }

    draw() {
        const xy = this.global;
        const size = this.size;
        cc.fillStyle = Widget.color(...this.color);
        cc.fillRect(xy[0], xy[1], size[0], size[1]);
    }

}

//------------------------------------------------------------------------------------------
//-- ImageWidget ---------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Displays an image.

export class ImageWidget extends Widget {

    loadFromURL(url) {
        this.image = LoadImage(url, image => {
            this.image = image;
            this.markChanged();
        });
        this.markChanged();
    }

    loadFromCanvas(c) {
        this.image = c;
        this.markChanged();
    }

    draw() {
        if (!this.image) return;
        const xy = this.global;
        const size = this.size;
        cc.drawImage(this.image, xy[0], xy[1], size[0], size[1]);
    }

}

//------------------------------------------------------------------------------------------
//-- NineSliceWidget -----------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Displays a nine-slice image that scales to preserve the proportions of its edges.

export class NineSliceWidget extends ImageWidget {
    constructor(parent) {
        super(parent);
        this.inset = [32, 32, 32, 32];      // Offset in pixels from edge of source to make slices
        this.insetScale = 1;                // Scaling factor to translate inset to screen pixels
    }

    setInset(inset) {
        this.inset = inset;
        this.markChanged();
    }

    setInsetScale(insetScale) {
        this.insetScale = insetScale;
        this.markChanged();
    }

    draw() {
        if (!this.image) return;
        const height = this.image.height;
        const width = this.image.width;
        const xy = this.global;
        const x = xy[0];
        const y = xy[1];
        const size = this.size;
        const xSize = size[0];
        const ySize = size[1];
        const left = this.inset[0];
        const top = this.inset[1];
        const right = this.inset[2];
        const bottom = this.inset[3];
        const scale = this.insetScale;

        // Left Column
        cc.drawImage(
            this.image,
            0, 0,
            left, top,
            x, y,
            left * scale, top * scale
        );
        cc.drawImage(
            this.image,
            0, top,
            left, height - top - bottom,
            x, y + top * scale,
            left * scale, ySize - (top + bottom) * scale
        );
        cc.drawImage(
            this.image,
            0, height - bottom,
            left, bottom,
            x, y + ySize- bottom * scale,
            left * scale, bottom * scale
        );

        //Middle Column
        cc.drawImage(
            this.image,
            left, 0,
            width - left - right, top,
            x + left * scale, y,
            xSize - (left + right) * scale, top * scale
        );
        cc.drawImage(
            this.image,
            left, top,
            width - left - right, height - top - bottom,
            x + left * scale, y + top * scale,
            xSize - (left + right) * scale, ySize - (top + bottom) * scale
        );
        cc.drawImage(
            this.image,
            left, height - bottom,
            width - left - right, bottom,
            x + left * scale, y + ySize - bottom * scale,
            xSize - (left + right) * scale, bottom * scale
        );

        // Right Column
        cc.drawImage(
            this.image,
            width-right, 0,
            right, top,
            x + xSize - right * scale, y,
            right * scale, top * scale
        );
        cc.drawImage(
            this.image,
            width-right, top,
            right, height - top - bottom,
            x + xSize - right * scale, y + top * scale,
            right * scale, ySize - (top + bottom) * scale
        );
        cc.drawImage(
            this.image,
            width-right, height - bottom,
            right, bottom,
            x + xSize - right * scale, y + ySize - bottom * scale,
            right * scale, bottom * scale
        );

    }

}

//------------------------------------------------------------------------------------------
//-- TextWidget ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Draws a piece of static text.
//
// Text should always be drawn over some background widget to refresh properly. When a text
// widget is updated, it triggers a refresh of its parent.

export class TextWidget extends Widget {

    constructor(parent) {
        super(parent);
        this.text = "Text";
        this.font = "sans-serif";
        this.style = "normal";
        this.point = 24;
        this.lineHeight = 30;
        this.maxLength = 0;
        this.alignX = "center";
        this.alignY = "middle";
        this.color = [0, 0, 0];
    }

    // Redrawing text requires the background to be cleared, so we mark the parent changed.
    markParentChanged() {
        if (this.parent) this.parent.markChanged();
    }

    setText(text) {
        this.text = text;
        this.markParentChanged();
    }

    setFontByURL(url) {
        this.font = LoadFont(url, () => this.markParentChanged());
        this.markParentChanged();
    }

    setPoint(point) {
        this.point = point;
        this.markParentChanged();
    }

    setStyle(style) {
        this.style = style;
        this.markParentChanged();
    }

    setAlignX(align) {
        this.alignX = align;
        this.markParentChanged();
    }

    setAlignY(align) {
        this.alignY = align;
        this.markParentChanged();
    }

    setLineHeight(lineHeight) {
        this.lineHeight = lineHeight;
        this.markParentChanged();
    }

    setMaxLength(maxLength) {
        this.maxLength = maxLength;
        this.markParentChanged();
    }

    setColor(color) {
        this.color = color;
        this.markParentChanged();
    }

    get alignnmentOffset() {
        const offset = [0,0];
        const size = this.size;
        switch (this.alignX) {
            case "center":
                offset[0] += size[0] / 2;
                break;
            case "right":
                offset[0] += size[0];
                break;
            default:
        }
        let newlineCount = 0;
        const newlines = this.text.match(/\n/g);
        if (newlines) newlineCount = newlines.length;
        switch (this.alignY) {
            case "middle":
                offset[1] += (size[1] - newlineCount * this.lineHeight) / 2;
                break;
            case "bottom":
                offset[1] += size[1] - newlineCount * this.lineHeight;
                break;
            default:
        }
        return offset;
    }

    breakLines(text) {
        if (!this.maxLength) return text;
        const words = text.split(' ');
        if (words.length < 2) return text;

        let out = words[0];
        let current = words[0].length;
        for (let i = 1; i < words.length; i++) {
            current += words[i].length + 1;
            let space = ' ';
            if (current > this.maxLength) {
                current = words[i].length;
                space = '\n';
            }
            out += space + words[i];
        }
        return out;
    }

    draw() {
        const lines = this.breakLines(this.text).split('\n');
        const xy = v2_add(this.global, this.alignnmentOffset);

        cc.textAlign = this.alignX;
        cc.textBaseline = this.alignY;
        cc.font = this.style + " " + this.point + "px " + this.font;
        cc.fillStyle = Widget.color(...this.color);

        let yOffset = 0;
        if (this.alignY === 'middle') {
            yOffset = this.lineHeight * (lines.length - 1) / 2;
        } else if (this.alignY === 'bottom') {
            yOffset = this.lineHeight * (lines.length - 1);
        }

        for (let i = 0; i<lines.length; i++) {
            cc.fillText(lines[i], xy[0], xy[1] + (i * this.lineHeight) - yOffset);
        }
    }
}

//------------------------------------------------------------------------------------------
//-- ButtonWidget --------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Draws a pressable button.
//
// The Normal/Hovered/Pressed  Box widgets can be replaced by NineSlice widgets for prettier buttons.

export class ButtonWidget extends Widget {

    constructor(parent) {
        super(parent);

        this.isHovered = false;
        this.isPressed = false;

        this.setNormal(new BoxWidget());
        this.normal.setColor([0.5,0.5,0.5]);

        this.setHovered(new BoxWidget());
        this.hovered.setColor([0.65,0.65,0.65]);

        this.setPressed(new BoxWidget());
        this.pressed.setColor([0.35,0.35,0.35]);

        this.setLabel(new TextWidget());

    }

    setNormal(widget) {
        if (this.normal) this.destroyChild(this.normal);
        this.normal = widget;
        this.normal.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setHovered(widget) {
        if (this.hovered) this.destroyChild(this.hovered);
        this.hovered = widget;
        this.hovered.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setPressed(widget) {
        if (this.pressed) this.destroyChild(this.pressed);
        this.pressed = widget;
        this.pressed.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setLabel(widget) {
        if (this.label) this.destroyChild(this.label);
        this.label = widget;
        this.label.setAutoSize([1,1]);
        this.addChild(widget);
    }

    update() {
        let background = this.normal;
        if (this.isHovered) background = this.hovered;
        if (this.isPressed) background = this.pressed;
        if (!this.isVisible) return;
        if (background) background.update();
        if (this.label) this.label.update();
    }

    mouse(xy) {
        if (!this.isVisible) return;
        const hover = this.inRect(xy);
        if (this.isHovered === hover) return;
        this.isHovered = hover;
        if (this.isPressed) this.isPressed = this.isHovered;
        this.markChanged();
    }

    touch(xy) {
        if (!this.isVisible) return;
        if (!this.isPressed || this.inRect(xy)) return;
        this.isPressed = false;
        this.markChanged();
    }

    press(xy) {
        if (!this.isVisible) return false;
        if (!this.inRect(xy)) return false;
        this.isPressed = true;
        this.markChanged();
        return true;
    }

    release(xy) {
        if (!this.isPressed) return;
        if (!this.inRect(xy)) return;
        this.isPressed = false;
        this.markChanged();
        this.onClick();
    }

    // Called when the user presses and releases the button.

    onClick() {
    }

}

//------------------------------------------------------------------------------------------
//-- ToggleWidget --------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Draws a button that can be toggled between an on and off state.

export class ToggleWidget extends Widget {

    constructor(parent) {
        super(parent);

        this.isOn = false;
        this.isHovered = false;
        this.isPressed = false;

        this.setNormalOff(new BoxWidget());
        this.normalOff.setColor([0.5, 0.5, 0.5]);

        this.setNormalOn(new BoxWidget());
        this.normalOn.setColor([0.5, 0.5, 0.7]);

        this.setHoveredOff(new BoxWidget());
        this.hoveredOff.setColor([0.6, 0.6, 0.6]);

        this.setHoveredOn(new BoxWidget());
        this.hoveredOn.setColor([0.6, 0.6, 0.8]);

        this.setPressedOff(new BoxWidget());
        this.pressedOff.setColor([0.4, 0.4, 0.4]);

        this.setPressedOn(new BoxWidget());
        this.pressedOn.setColor([0.4, 0.4, 0.6]);

        this.setLabelOff(new TextWidget());
        this.labelOff.setText("Off");

        this.setLabelOn(new TextWidget());
        this.labelOn.setText("On");

    }

    setNormalOn(widget) {
        if (this.normalOn) this.destroyChild(this.normalOn);
        this.normalOn = widget;
        this.normalOn.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setNormalOff(widget) {
        if (this.normalOff) this.destroyChild(this.normalOff);
        this.normalOff = widget;
        this.normalOff.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setHoveredOn(widget) {
        if (this.hoveredOn) this.destroyChild(this.hoveredOn);
        this.hoveredOn = widget;
        this.hoveredOn.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setHoveredOff(widget) {
        if (this.hoveredOff) this.destroyChild(this.hoveredOff);
        this.hoveredOff = widget;
        this.hoveredOff.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setPressedOn(widget) {
        if (this.pressedOn) this.destroyChild(this.pressedOn);
        this.pressedOn = widget;
        this.pressedOn.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setPressedOff(widget) {
        if (this.pressedOff) this.destroyChild(this.pressedOff);
        this.pressedOff = widget;
        this.pressedOff.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setLabelOn(widget) {
        if (this.labelOn) this.destroyChild(this.labelOn);
        this.labelOn = widget;
        this.labelOn.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setLabelOff(widget) {
        if (this.labelOff) this.destroyChild(this.labelOff);
        this.labelOff = widget;
        this.labelOff.setAutoSize([1,1]);
        this.addChild(widget);
    }

    setState(flag) {
        if (this.isOn === flag) return;
        this.isOn = flag;
        this.markChanged();
    }

    update() {
        let background;
        let label;
        if (this.isOn) {
            background = this.normalOn;
            if (this.isHovered) background = this.hoveredOn;
            if (this.isPressed) background = this.pressedOn;
            label = this.labelOn;
        } else {
            background = this.normalOff;
            if (this.isHovered) background = this.hoveredOff;
            if (this.isPressed) background = this.pressedOff;
            label = this.labelOff;
        }
        if (!this.isVisible) return;
        if (background) background.update();
        if (label) label.update();
    }

    mouse(xy) {
        if (!this.isVisible) return;
        const hover = this.inRect(xy);
        if (this.isHovered === hover) return;
        this.isHovered = hover;
        if (this.isPressed) this.isPressed = this.isHovered;
        this.markChanged();
    }

    touch(xy) {
        if (!this.isVisible) return;
        if (!this.isPressed || this.inRect(xy)) return;
        this.isPressed = false;
        this.markChanged();
    }

    press(xy) {
        if (!this.isVisible) return false;
        if (!this.inRect(xy)) return false;
        this.isPressed = true;
        this.markChanged();
        return true;
    }

    release(xy) {
        if (!this.isPressed) return;
        if (!this.inRect(xy)) return;
        this.isPressed = false;
        if (this.set) {
            this.set.pick(this);
        } else {
            this.changeState(!this.isOn);
        }
        this.markChanged();
    }

    changeState(flag) {
        if (this.isOn === flag) return;
        this.isOn = flag;
        if (flag) {
            this.onToggleOn();
        } else {
            this.onToggleOff();
        }
        this.markChanged();
    }

    // Called when the user changes the toggle state, either directly or indirectly through a ToggleSet.

    onToggleOn() {
    }

    onToggleOff() {
    }

}

//------------------------------------------------------------------------------------------
//-- ToggleSet -----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Helper class that manages a linked set of toggle widgets.

export class ToggleSet  {
    constructor() {
        this.toggles = new Set();
    }

    add(toggle) {
        this.toggles.add(toggle);
        toggle.set = this;
    }

    remove(toggle) {
        this.toggles.remove(toggle);
        toggle.set = null;
    }

    pick(on) {
        if (on.isOn) return; // Can't turn off a toggle in a set directly
        on.changeState(true);
        this.toggles.forEach(toggle => { if (toggle !== on) toggle.changeState(false); });
    }

}

//------------------------------------------------------------------------------------------
//-- SliderWidget -----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Managages a slider.
//
// The Bar and Knob can be replaced by Image/NineSlice widgets for a prettier look.
// The Knob will always be square and match the short dimension of the bar.

export class SliderWidget extends Widget {

    constructor(parent) {
        super(parent);

        this.setBar(new BoxWidget());
        this.bar.setColor([0.5, 0.5, 0.5]);

        this.setKnob(new BoxWidget());
        this.knob.setColor([0.8, 0.8, 0.8]);
        this.knob.setBorder([2,2,2,2]);

        this.percent = 0;   // The current value of the slider.
        this.steps = 0;     // The number of descrete steps the slider has. (0=continuous)

        this.setPercent(1);

    }

    setSize(size) {
        super.setSize(size);
        this.setKnobSize();
    }

    setBar(widget) {
        if (this.bar) this.destroyChild(this.bar);
        this.bar = widget;
        this.addChild(widget);
        this.bar.setAutoSize([1,1]);
    }

    setKnob(widget) {
        if (this.knob) this.destroyChild(this.knob);
        this.knob = widget;
        this.addChild(widget);
        this.setKnobSize();
    }

    setKnobSize() {
        if (this.isHorizontal) {
            this.knob.setSize([this.size[1], this.size[1]]);
        } else {
            this.knob.setSize([this.size[0], this.size[0]]);
        }
        if (!this.isVisible) return;
        this.updateKnob();
    }

    setSteps(steps) {
        this.steps = steps;
        this.setPercent(this.percent);
    }

    setPercent(percent) {
        if (this.steps) {
            this.percent = Math.round(percent * (this.steps-1)) / (this.steps-1);
        } else {
            this.percent = percent;
        }
        if (!this.isVisible) return;
        this.updateKnob();
    }

    updateKnob() {
        if (!this.knob) return;
        const xy = this.knob.local;
        if (this.isHorizontal) {
            xy[0] = (this.size[0] - (this.knob.size[0] + this.knob.border[0] + this.knob.border[2])) * this.percent;
        } else {
            xy[1] = (this.size[1] - (this.knob.size[1] + this.knob.border[1] + this.knob.border[3])) * this.percent;
        }
        this.knob.setLocal(xy);
        this.markChanged();
    }

    get isHorizontal() {
        return this.size[0] > this.size[1];
    }

    update() {
        if (!this.isVisible) return;
        if (this.bar) this.bar.update();
        if (this.knob) this.knob.update();
    }

    moveKnob(xy) {
        if (!this.isPressed) return;
        const old = this.percent;
        const local = v2_sub(xy, this.global);
        if (this.isHorizontal) {
            this.setPercent(Math.max(0,Math.min(1,local[0] / this.size[0])));
        } else {
            this.setPercent(Math.max(0,Math.min(1,local[1] / this.size[1])));
        }
        if (this.percent === old) return;
        this.onChange(this.percent);
    }

    press(xy) {
        if (!this.isVisible) return false;
        if (!this.inRect(xy)) return false;
        this.isPressed = true;
        this.moveKnob(xy);
        return true;
    }

    release(xy) {
        this.moveKnob(xy);
        this.isPressed = false;
    }

    mouse(xy) {
        this.moveKnob(xy);
    }

    touch(xy) {
        this.moveKnob(xy);
    }

    // Called when the user changes the slider.
    onChange(percent) {
    }

}
