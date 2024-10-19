import { cloneDeep } from 'lodash-es';
import { computed, reactive, readonly, ref } from 'vue';


let id = 0

function newId(prefix: string): string
function newId(): number
function newId(prefix?: string) {
    id++;
    return prefix ? prefix + id : id;
}


function createWidget(widget: string, opts?: Partial<Pick<ISchema, 'props' | 'children'>>): ISchema {
    return {
        id: widget + '_' + newId(),
        widget,
        props: opts?.props ?? {},
        children: opts?.children ?? []
    }
}


function updateObject(schema: any, patch: Patch): Patch | null {


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

    function onAdd(patch: AddPatch): Patch | null {

        if (patch.path.length === 0) {
            console.error('invalid path for add operation:', patch.path)
            return null;
        }

        const index = (patch.path)[patch.path.length - 1]
        if (!isNumber(index)) {
            console.error('invalid path for add operation:', patch.path)
            return null;
        }

        const node = findNonObjectNode(schema, patch.path, 0, patch.path.length - 1)

        if (node.index >= 0) {
            const parent = makeObject(node.parent, patch.path, node.index, patch.path.length - 1)
            const value = cloneDeep(patch.value)
            parent.splice(Number(index), 0, value)

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
            parent.splice(Number(index), 0, value)
            return patch
        }

    }

    function onUpdate(patch: UpdatePatch): Patch | null {
        return null
    }

    function onRemove(patch: RemovePatch): Patch | null {
        return null
    }

    function onMove(patch: MovePatch): Patch | null {
        return null
    }

    switch (patch.type) {
        case 'add':
            return onAdd(patch)
        case 'remove':
            return onRemove(patch)
        case 'update':
            return onUpdate(patch)
        case 'move':
            return onMove(patch)
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
        updateSchema(...patches: Patch[]): void {
            for (const patch of patches) {
                const _patch = updateObject(schema.value, patch);
                if (_patch) {
                    changes.push(_patch)
                }
            }
        },
        syncChanges() {
            const _changes = changes;
            changes = [];
            console.log('changes:', _changes)
        },
        createWidget,
    } as const)
}