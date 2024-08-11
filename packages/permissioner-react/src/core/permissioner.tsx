import {
    PermissionCheckParameters,
    Permissioner,
    type FallbackPermissionTable,
    type PermissionCheckers,
    type Permissions,
    type PermsCheckersData
} from "@tiq/permissioner";
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type FC,
    type PropsWithChildren
} from "react";

export function createReactPermissioner<
    Perms extends Permissions,
    CheckersData extends PermsCheckersData<Perms>,
    Context
>(
    checkers: PermissionCheckers<Perms, CheckersData, Context>,
    fallback: FallbackPermissionTable<Perms>
) {
    const permissionerContext = createContext<
        Permissioner<Perms, CheckersData, Context> | undefined
    >(undefined);

    const PermissionerProvider: FC<
        PropsWithChildren<{
            context: Context;
        }>
    > = (props) => {
        const permContextValue: Permissioner<Perms, CheckersData, Context> =
            useMemo(
                () => new Permissioner(fallback, checkers, props.context),
                [fallback, checkers, props.context]
            );

        return (
            <permissionerContext.Provider value={permContextValue}>
                {props.children}
            </permissionerContext.Provider>
        );
    };

    function usePermission<KF extends keyof Perms, KA extends keyof Perms[KF]>(
        ...params: PermissionCheckParameters<Perms, CheckersData, KF, KA>
    ): boolean {
        const permContext = useContext(permissionerContext);

        if (!permContext) {
            throw new Error("Permissioner context not found");
        }

        const [result, setResult] = useState(false);

        useEffect(() => {
            permContext
                .hasPermission(...params)
                .then((newResult) => setResult(newResult));
        }, [permContext, ...params]);

        return result;
    }

    return {
        PermissionerProvider,
        usePermission
    };
}
