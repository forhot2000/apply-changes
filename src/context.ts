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


function isNumber(key: Key) {
    return !isNaN(Number(key));
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

function onAdd(schema: any, patch: AddPatch): Patch | null {

    if (patch.path.length === 0) {
        console.error('invalid path:', patch.path)
        return null;
    }

    const key = (patch.path)[patch.path.length - 1]
    if (!isNumber(key)) {
        console.error('invalid path:', patch.path)
        return null;
    }

    const node = findNonObjectNode(schema, patch.path, 0, patch.path.length - 1)

    if (node.index >= 0) {
        const parent = makeObject(node.parent, patch.path, node.index, patch.path.length - 1)
        const value = cloneDeep(patch.value)
        parent.splice(Number(key), 0, value)

        return {
            type: 'update',
            path: patch.path.slice(0, node.index + 1),
            value: cloneDeep(node.parent[patch.path[node.index]]),
        }

    } else {
        const parent = node.parent
        if (!Array.isArray(parent)) {
            return null;
        }

        const value = cloneDeep(patch.value)
        parent.splice(Number(key), 0, value)
        return patch
    }
}

function onUpdate(schema: any, patch: UpdatePatch): Patch | null {

    if (patch.path.length === 0) {
        console.error('invalid path:', patch.path)
        return null;
    }

    const key = (patch.path)[patch.path.length - 1]

    const node = findNonObjectNode(schema, patch.path, 0, patch.path.length - 1)

    if (node.index >= 0) {
        const parent = makeObject(node.parent, patch.path, node.index, patch.path.length - 1)
        const value = cloneDeep(patch.value)
        parent[key] = value

        return {
            type: 'update',
            path: patch.path.slice(0, node.index + 1),
            value: cloneDeep(node.parent[patch.path[node.index]]),
        }

    } else {
        const parent = node.parent
        const value = cloneDeep(patch.value)
        parent[key] = value
        return patch
    }
}

function onRemove(schema: any, patch: RemovePatch): Patch | null {

    if (patch.path.length === 0) {
        console.error('invalid path:', patch.path)
        return null;
    }

    const key = (patch.path)[patch.path.length - 1]

    const node = findNonObjectNode(schema, patch.path, 0, patch.path.length - 1)

    if (node.index < 0) {
        if (isNumber(key)) {
            node.parent.splice(key, 1)
        } else {
            delete node.parent[key]
        }
        return patch
    }

    return null
}

function onMove(schema: any, patch: MovePatch): Patch | null {

    if (patch.from.length === 0) {
        console.error('invalid from:', patch.from)
        return null;
    }

    if (patch.path.length === 0) {
        console.error('invalid path:', patch.path)
        return null;
    }

    const fromKey = (patch.from)[patch.from.length - 1]
    const key = (patch.path)[patch.path.length - 1]

    const fromNode = findNonObjectNode(schema, patch.from, 0, patch.from.length - 1)

    if (fromNode.index >= 0) {
        console.error('invalid from (not exists):', patch.from)
        return null
    }

    const node = findNonObjectNode(schema, patch.path, 0, patch.path.length - 1)

    if (fromNode.index >= 0) {
        console.error('invalid path (not exists):', patch.path)
        return null
    }

    const value: any = node.parent[fromKey]
    if (isNumber(fromKey)) {
        node.parent.splice(fromKey, 1)
    } else {
        delete node.parent[fromKey]
    }

    if (node.index < 0) {
        if (isNumber(key)) {
            node.parent.splice(key, 0, value)
        } else {
            node.parent[key] = value
        }
        return patch
    }

    return null
}


function updateObject(schema: any, patch: Patch): Patch | null {
    switch (patch.type) {
        case 'add':
            return onAdd(schema, patch)
        case 'remove':
            return onRemove(schema, patch)
        case 'update':
            return onUpdate(schema, patch)
        case 'move':
            return onMove(schema, patch)
        default:
            return patch
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
                const _patch = updateObject(schema.value, patch);
                if (_patch) {
                    changes.push(_patch)
                }
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