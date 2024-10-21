import { cloneDeep } from 'lodash-es';
import { computed, reactive, readonly, ref } from 'vue';


let id = 0;

function newId(): number {
    id++;
    return id;
}


function createWidget(widget: string, opts?: Partial<Pick<ISchema, 'props' | 'children'>>): ISchema {
    return {
        id: widget + '_' + newId(),
        widget,
        props: opts?.props ?? {},
        children: opts?.children ?? []
    }
}


function isNumber(val: any) {
    return !isNaN(val);
}

function findNonObjectNode(obj: any, path: Path, start: number, end: number): { index: number, parent?: any } {
    let temp = obj;
    for (let i = start; i < end; i++) {
        const k = path[i]
        if (!temp[k]) {
            return { index: i, parent: temp }
        }
        temp = temp[k]
    }
    return { index: -1, parent: temp };
}

function makeObject(obj: any, path: Path, start: number, end: number) {
    let temp = obj
    for (let i = start; i < end; i++) {
        if (isNumber(path[i + 1])) {
            temp = temp[path[i]] = []
        } else {
            temp = temp[path[i]] = {};
        }
    }
    return temp
}

function applyAddPatch(obj: any, patch: AddPatch, callback: (patch: Patch) => void) {

    if (patch.path.length === 0) {
        console.error('invalid path:', patch.path)
        return;
    }

    const key = (patch.path)[patch.path.length - 1]

    if (!isNumber(key)) {
        console.error('invalid path:', patch.path)
        return;
    }

    const node = findNonObjectNode(obj, patch.path, 0, patch.path.length - 1)

    if (node.index >= 0) {
        const parent = makeObject(node.parent, patch.path, node.index, patch.path.length - 1)
        const value = cloneDeep(patch.value)
        parent.splice(+key, 0, value)

        return callback({
            type: 'update',
            path: patch.path.slice(0, node.index + 1),
            value: cloneDeep(node.parent[patch.path[node.index]]),
        })

    } else {
        const parent = node.parent

        if (!Array.isArray(parent)) {
            console.error('invalid path (not array):', patch.path)
            return;
        }

        if (+key > parent.length) {
            console.error('invalid path (array index overflow):', patch.path)
            return;
        }

        const value = cloneDeep(patch.value)
        parent.splice(+key, 0, value)
        return callback(patch)
    }
}

function applyUpdatePatch(obj: any, patch: UpdatePatch, callback: (patch: Patch) => void) {

    if (patch.path.length === 0) {
        console.error('invalid path:', patch.path)
        return;
    }

    const key = (patch.path)[patch.path.length - 1]

    const node = findNonObjectNode(obj, patch.path, 0, patch.path.length - 1)

    if (isNumber(key)) {
        if (+key >= node.parent.length) {
            console.error('invalid path (array index overflow):', patch.path)
            return;
        }
    }

    if (node.index >= 0) {
        const parent = makeObject(node.parent, patch.path, node.index, patch.path.length - 1)
        const value = cloneDeep(patch.value)
        parent[key] = value

        return callback({
            type: 'update',
            path: patch.path.slice(0, node.index + 1),
            value: cloneDeep(node.parent[patch.path[node.index]]),
        })

    } else {
        const parent = node.parent
        const value = cloneDeep(patch.value)
        parent[key] = value
        return callback(patch)
    }
}

function applyRemovePatch(obj: any, patch: RemovePatch, callback: (patch: Patch) => void) {

    if (patch.path.length === 0) {
        console.error('invalid path:', patch.path)
        return;
    }

    const key = (patch.path)[patch.path.length - 1]

    const node = findNonObjectNode(obj, patch.path, 0, patch.path.length - 1)

    if (node.index >= 0) {
        console.error('invalid path (not exists):', patch.path)
        return;
    }

    if (isNumber(key)) {
        if (+key >= node.parent.length) {
            console.error('invalid path (array index overflow):', patch.path)
            return;
        }
    }

    if (isNumber(key)) {
        node.parent.splice(+key, 1)
    } else {
        delete node.parent[key]
    }
    return callback(patch)
}

function applyMovePatch(obj: any, patch: MovePatch, callback: (patch: Patch) => void) {

    if (patch.from.length === 0) {
        console.error('invalid from:', patch.from)
        return;
    }

    if (patch.path.length === 0) {
        console.error('invalid path:', patch.path)
        return;
    }

    const fromKey = (patch.from)[patch.from.length - 1]
    const key = (patch.path)[patch.path.length - 1]

    const fromNode = findNonObjectNode(obj, patch.from, 0, patch.from.length - 1)

    if (fromNode.index >= 0) {
        console.error('invalid from (not exists):', patch.from)
        return;
    }

    if (isNumber(fromKey)) {
        if (+fromKey >= fromNode.parent.length) {
            console.error('invalid from (array index overflow):', patch.from)
            return;
        }
    }

    const node = findNonObjectNode(obj, patch.path, 0, patch.path.length - 1)

    if (node.index >= 0) {
        console.error('invalid path (not exists):', patch.path)
        return;
    }

    if (isNumber(key)) {
        if (+key > node.parent.length - (fromNode.parent === node.parent ? 1 : 0)) {
            console.error('invalid path (array index overflow):', patch.path)
            return;
        }
    }

    const value: any = fromNode.parent[fromKey]
    if (isNumber(fromKey)) {
        fromNode.parent.splice(+fromKey, 1)
    } else {
        delete fromNode.parent[fromKey]
    }

    if (isNumber(key)) {
        node.parent.splice(+key, 0, value)
    } else {
        node.parent[key] = value
    }
    return callback(patch)
}


function applyPatch(obj: any, patch: Patch, callback: (patch: Patch) => void) {
    switch (patch.type) {
        case 'add':
            return applyAddPatch(obj, patch, callback)
        case 'remove':
            return applyRemovePatch(obj, patch, callback)
        case 'update':
            return applyUpdatePatch(obj, patch, callback)
        case 'move':
            return applyMovePatch(obj, patch, callback)
        default:
            return callback(patch)
    }
}

export default function useContext(): IContext {

    const schema = ref<ISchema>(createWidget('page'))

    const readonlySchema = computed(() => readonly(schema.value))

    let changes: Patch[] = [];

    const theme = ref<Theme>('light')

    return reactive({
        schema: readonlySchema,
        theme,
        pushChanges(...patches: Patch[]): void {
            for (const patch of patches) {
                applyPatch(schema.value, patch, (_patch) => {
                    changes.push(_patch)
                    // TODO: update schema node map
                });
            }
        },
        updateChanges() {
            if (changes.length) {
                const _changes = changes;
                changes = [];
                console.log('changes:', _changes)
            } else {
                console.log('no changes')
            }
        },
        createWidget,
    } as const)
}
