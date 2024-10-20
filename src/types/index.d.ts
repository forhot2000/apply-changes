import { DeepReadonly } from "vue";

declare global {

    interface ISchema {
        id: string;
        widget: string;
        props: Record<string, any>;
        children: ISchema[]
    }

    type Theme = 'light' | 'dark'

    type Key = string | number

    type Path = Key[]


    type UpdatePatch = {
        type: 'update',
        path: Path,
        value: any
    }

    type AddPatch = {
        type: 'add',
        path: Path,
        value: any
    }

    type RemovePatch = {
        type: 'remove',
        path: Path
    }

    type MovePatch = {
        type: 'move',
        from: Path,
        path: Path
    }

    type Patch = UpdatePatch | AddPatch | RemovePatch | MovePatch

    interface IContext {
        schema: DeepReadonly<ISchema>
        theme: Theme
        pushChanges: (...patches: Patch[]) => void
        updateChanges: () => void
        createWidget: (widget: string, opts?: Partial<Pick<ISchema, 'props' | 'children'>>) => ISchema
    }

}