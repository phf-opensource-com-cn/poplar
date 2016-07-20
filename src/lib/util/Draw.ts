/**
 * Created by grzhan on 16/7/1.
 */
/// <reference path="../../svgjs/svgjs.d.ts" />

export class Draw {
    private board;
    private  margin = 15;
    private  lineHeight = 30;
    private needExtend = false;
    constructor(board) {
        this.board = board;
    }

    public highlight(selector, color='#e8fbe8') {
        let {width, height, left, top} = selector;
        return this.board.group['highlight'].rect(width, height).move(left, top).attr({fill: color});
    }
    
    public textline(lineNo, content, left, top) {
        return this.board.group['text'].text(content).attr({'data-id': `text-line-${lineNo}`}).move(left, top).font({size: 14});
    }

    public annotation(id, cid, selector) {
        this.needExtend = false;
        let margin = this.margin;
        let lineNo = selector.lineNo;
        let content = this.board.category[cid - 1]['text'];
        let textDef = this.board.svg.defs().text(content).size(12);
        let width = textDef.node.clientWidth;
        let height = textDef.node.clientHeight;
        let left = selector.left + selector.width / 2 - width / 2;
        let top = this.calcAnnotationTop(textDef, selector);
        let text = this.board.svg.use(textDef).move(left, top);
        let fillColor = this.board.category[cid -1]['fill'];
        let strokeColor = this.board.category[cid -1]['boader'];
        let rect = this.board.svg.rect(width + 4, height + 4).move(left - 2 , top + 2).fill(fillColor).stroke(strokeColor).radius(2).attr({'data-id': `label-${id}`});
        let annotateGroup = this.board.svg.group();
        let bHeight = margin - 6;
        let bTop = top + rect.height() + 2;
        let bracket = this.bracket(cid, selector.left, bTop, selector.left + selector.width, bTop, bHeight);
        annotateGroup.add(rect);
        annotateGroup.add(text);
        annotateGroup.add(bracket);
        this.board.labelsSVG[id] = {rect, lineNo};
        this.board.lines['annotation'][lineNo - 1].push(annotateGroup);
        if (this.needExtend) {
            this.extendAnnotationLine(lineNo);
        }
    }
    
    public label(id, cid, selector) {
        let extendHeight = 0;
        let lineNo = selector.lineNo;
        let {width, height, left, top} = selector;
        if (this.board.lines.annotation[lineNo - 1].length < 1) {
            selector.top +=  this.extendAnnotationLine(lineNo);
        }
        let highlight = this.highlight(selector, this.board.category[cid - 1]['highlight']);
        this.board.lines['highlight'][lineNo - 1].push(highlight);
        this.annotation(id, cid, selector);
    }

    public relation(srcId, dstId, cid=1) {
        this.needExtend = false;
        let content = this.board.lcategory[cid - 1]['text'];
        let textDef = this.board.svg.defs().text(content).size(12);
        let width = textDef.node.clientWidth;
        let height = textDef.node.clientHeight;
        let src = this.board.labelsSVG[srcId].rect;
        let dst = this.board.labelsSVG[dstId].rect;
        let lineNo = this.board.labelsSVG[srcId].lineNo;
        let srcX = src.x() + src.parent().transform()['x'];
        let srcY = src.y() + src.parent().transform()['y'];
        let dstX = dst.x() + dst.parent().transform()['x'];
        let dstY = dst.y() + dst.parent().transform()['y'];
        let distance = srcX < dstX ? dstX + dst.width() - srcX : srcX + src.width() - dstX;
        let left = (srcX + dstX + dst.width()) / 2 - width / 2;
        let deltaY = srcY < dstY ? 0 : srcY - dstY;
        let x0 = srcX < dstX ? srcX : srcX + src.width();
        let y0 = srcY + src.height() / 2;
        let cx1 = srcX < dstX ? x0 - 20 : x0 + 20;
        let top = this.calcRelationTop(lineNo, width, height, y0 - (this.margin + height + deltaY), left);
        let cy1 = top + height / 2;
        let x1 = x0;
        let y1 = cy1;
        let x2 = srcX < dstX ? dstX + dst.width() + 10 : dstX - 10;
        let cx2 = srcX < dstX ? x2 + 10 : x2 - 10;
        let cy2 = y1;
        let x3 = srcX < dstX ? dstX + dst.width() : dstX;
        let y3 = dstY - 2;
        if (distance < width) {
            cx1 = srcX < dstX ? left - 20 : left + width + 20;
            x1 = srcX < dstX ? left - 10 : left + width + 10;
            x2 = srcX < dstX ? left + width + 10 : left - 10;
            cx2 = srcX < dstX ? x2 + 10 : x2 - 10;
        }
        let group = this.board.group['relation'].group();
        let path = group.path(`M${x0} ${y0}Q${cx1} ${cy1} ${x1} ${y1} H${x2} Q${cx2} ${cy2} ${x3} ${y3}`)
            .fill('none').stroke({color: '#000'});
        path.marker('end', 5,5, add => {
            add.polyline('0,0 5,2.5 0,5 0.2,2.5');
        });
        group.rect(width + 4, height).move(left - 2, top).fill('#fff');
        group.use(textDef).move(left, top - height / 4);
        this.board.lines['relation'][lineNo - 1].push(group);
        window['r'] = this.board.lines['relation'];
        if (this.needExtend) {
            this.extendAnnotationLine(lineNo);
        }
    }

    // Thanks to Alex Hornbake (function for generate curly bracket path)
    // http://bl.ocks.org/alexhornbake/6005176
    public bracket(cid, x1,y1,x2,y2,width,q=0.6) {
        //Calculate unit vector
        let dx = x1-x2;
        let dy = y1-y2;
        let len = Math.sqrt(dx*dx + dy*dy);
        dx = dx / len;
        dy = dy / len;

        //Calculate Control Points of path,
        let qx1 = x1 + q*width*dy;
        let qy1 = y1 - q*width*dx;
        let qx2 = (x1 - .25*len*dx) + (1-q)*width*dy;
        let qy2 = (y1 - .25*len*dy) - (1-q)*width*dx;
        let tx1 = (x1 -  .5*len*dx) + width*dy;
        let ty1 = (y1 -  .5*len*dy) - width*dx;
        let qx3 = x2 + q*width*dy;
        let qy3 = y2 - q*width*dx;
        let qx4 = (x1 - .75*len*dx) + (1-q)*width*dy;
        let qy4 = (y1 - .75*len*dy) - (1-q)*width*dx;
        return this.board.svg.path(`M${x1},${y1}Q${qx1},${qy1},${qx2},${qy2}T${tx1},${ty1}M${x2},${y2}Q${qx3},${qy3},${qx4},${qy4}T${tx1},${ty1}`)
            .fill('none').stroke({ color: this.board.category[cid - 1]['boader'], width: 0.5}).transform({rotation: 180});
    }
    
    private extendAnnotationLine(lineNo) {
        let s = lineNo - 1;                     // Array lines.* index
        let textlines = this.board.lines['text'];
        let highlights = this.board.lines['highlight'];
        let annotations = this.board.lines['annotation'];
        let relations = this.board.lines['relation'];
        let lineHeight = this.lineHeight;
        for (let i = s; i < textlines.length; i++) {
            textlines[i].dy(lineHeight);
            if (highlights[i]) {
                for (let highlight of highlights[i]) {
                    highlight.dy(lineHeight);
                }
            }
            if (annotations[i]) {
                for (let annotation of annotations[i]) {
                    let {y} = annotation.transform();
                    annotation.transform({y: y+lineHeight});
                }
            }
            if (relations[i]) {
                for (let relation of relations[i]) {
                    let {y} = relation.transform();
                    relation.transform({y: y+lineHeight});
                }
            }
        }
        this.board.style.height += lineHeight;
        this.board.svg.size(this.board.style.width, this.board.style.height);
        return this.lineHeight;
    }

    private calcAnnotationTop(text, selector) {
        let lineNo = selector.lineNo;
        let width = text.node.clientWidth;
        let height = text.node.clientHeight;
        let left = selector.left + selector.width / 2 - width / 2;
        let top = selector.top - this.margin - height;
        while (this.isCollisionInLine(lineNo, width + 4, height + 4, left - 2, top + 2)) {
            top -= this.lineHeight;
        }
        return top;
    }

    private calcRelationTop(lineNo, width, height, top, left) {
        console.log(top);
        while (this.isCollisionInLine(lineNo, width + 10, height, left - 5, top)) {
            top -= this.lineHeight;
            console.log(top);
        }
        return top;
    }

    private isCollisionInLine(lineNo, width, height, left, top) {
        let annotations = this.board.lines['annotation'][lineNo - 1];
        let relations = this.board.lines['relation'][lineNo -1];
        if (annotations.length < 1 && relations.length < 1) {
            return false;
        }
        let minY = 100000000;
        let testCollision = elements => {
            for (let element of elements) {
                let y = element.y() + element.parent().transform()['y'];
                if (element.type == 'rect') {
                    if (minY > y) {
                        minY = y;
                    }
                    if (this.isCollision(left, top, width, height, element.x(), y, element.width(), element.height())) {
                        return true;
                    }
                }
            }
            return false;
        };
        for (let annotaion of annotations) {
            let elements = annotaion.children();
            if (testCollision(elements)) return true;
        }
        for (let relation of relations) {
            let elements = relation.children();
            if (testCollision(elements)) return true;
        }
        if (top < minY - 2) {
            this.needExtend = true;
        }
        return false;
    }

    private isCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        if (x1 >= x2 && x1 >= x2 + w2) {
            return false;
        } else if (x1 <= x2 && x1 + w1 <= x2) {
            return false;
        } else if (y1 >= y2 && y1 >= y2 + h2) {
            return false;
        } else if (y1 <= y2 && y1 + h1 <= y2) {
            return false;
        }
        return true;
    }
}