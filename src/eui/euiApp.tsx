import React, {useMemo, useRef, useState} from "react";
import {
    EuiFlyout,
    EuiModal,
    EuiGlobalToastList,
} from "@elastic/eui";
import {Toast} from "@elastic/eui/src/components/toast/global_toast_list";



export type RenderFunction = (props: { appCtx: AppContext }) => JSX.Element
export type Consumer<T> = (a: T) => void
export type ToastShow = Omit<Toast, "id"> | string
export interface AppContext {
    openModal(rf: RenderFunction): void;
    closeModal(): void;
    showToast(toast: ToastShow): void;
}

export const TreeAppContext = React.createContext<AppContext | undefined>(undefined);

export function appHooks(): {
    ctx: AppContext,
    comps: () => JSX.Element,
} {
    const componentState = {
        flyout: useState<RenderFunction | null>(null),
        modals: useState<RenderFunction[]>([]),
        toasts: useState<Toast[]>([]),
    }
    const [flyout, setFlyout] = componentState.flyout
    const [modals, setModals] = componentState.modals
    const [toasts, setToasts] = componentState.toasts

    const removeToast = (id: string) => {
        const filtered = toasts.filter(t => t.id != id);
        console.log(`toasts ${toasts.length} - '${id}' = ${filtered.length}`)
        setToasts(filtered);
    };

    const compStateRef = useRef<typeof componentState>()
    compStateRef.current = componentState

    const appCtx = useMemo<AppContext>(() => {
        const state = () => compStateRef.current as typeof componentState
        return {
            openModal(rf: RenderFunction) {
                const [modals, setModals] = state().modals
                setModals([...modals, rf])
            },
            closeModal() {
                const [modals, setModals] = state().modals
                setModals(modals.slice(0, modals.length - 1))
            },
            showToast(toast: ToastShow) {
                const [toasts, setToasts] = state().toasts
                if (typeof toast == 'string') toast = {text: toast}
                const id = Math.random().toString()
                console.log(`toasts = ${toasts.length} + ${id}`)
                setToasts([...toasts, {
                    id,
                    ...toast,
                }])
            },
        }
    }, [])

    return {
        ctx: appCtx,
        comps: () => (<React.Fragment>
            {modals.length == 0 ? null : (() => {
                    const mm = { modal: modals[modals.length - 1] }
                    return <EuiModal onClose={() => {
                        const nm = modals.slice(0, modals.length - 1);
                        setModals(nm);
                    }}>
                    <mm.modal appCtx={appCtx} />
                    </EuiModal>
                })()}

            {flyout == null ? null : (() => {
                // TODO how to do it without this wrapper
                const ff = { flyout }
                return <EuiFlyout
                    ownFocus
                onClose={() => setFlyout(null)}
            >
                <ff.flyout appCtx={appCtx} />
                </EuiFlyout>
            })()}

            <EuiGlobalToastList
                dismissToast={t => removeToast(t.id)}
            toasts={toasts}
            toastLifeTimeMs={5000} />
        </React.Fragment>)
    }
}