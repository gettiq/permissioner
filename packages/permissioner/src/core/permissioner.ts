export type Permissions = Record<string, Functionality>;

type Functionality = Record<string, Action>;

type Action = readonly string[];

/**
 * This is a helper type you use to wrap your Permissions object with.
 */
export type CreatePermissions<Perms extends Permissions> = Perms;

/**
 * This is a helper type used to verfiy that the data types defined
 * for the checkers follow the original Permissions model.
 */
export type PermsCheckersData<T> = {
    [KP in keyof T]: Partial<{
        [KA in keyof T[KP]]: unknown;
    }>;
};

/**
 * This is a helper type used to create the data types for the checkers.
 */
export type CreatePermsCheckersData<
    Perms extends Permissions,
    Checkers extends PermsCheckersData<Perms>
> = Checkers;

type ActionConditionsChecker<Data, Conditions, Context> = (
    context: Context,
    conditions: Conditions,
    data: Data
) => boolean | Promise<boolean>;

type ConditionKeys<A extends Action> = {
    [K in A[number]]: boolean;
};

export type ActionCheckerData<
    Perms,
    Params extends PermsCheckersData<Perms>,
    KF extends keyof Perms,
    KA extends keyof Perms[KF]
> =
    Params extends Record<KF, unknown>
        ? Params[KF] extends Record<KA, unknown>
            ? Params[KF][KA]
            : undefined
        : undefined;

export type ActionChecker<
    Perms,
    Params extends PermsCheckersData<Perms>,
    Context,
    KF extends keyof Perms,
    KA extends keyof Perms[KF]
> = Perms[KF][KA] extends Action
    ? ActionConditionsChecker<
          ActionCheckerData<Perms, Params, KF, KA>,
          ConditionKeys<Perms[KF][KA]>,
          Context
      >
    : never;

type FunctionalityCheckers<
    Perms,
    Params extends PermsCheckersData<Perms>,
    Context,
    KF extends keyof Perms
> = {
    [KA in keyof Perms[KF]]?: ActionChecker<Perms, Params, Context, KF, KA>;
};

/**
 * The PermissionCheckers object is used to define the checkers for each action in a functionality.
 *
 * Checkers are invoked when the user tries to perform an action and the default permissions for the action is not true.
 *
 * The checker receives the context, the conditions for the action and the data for the action
 * and uses these informations to determine if the user can perform the action.
 */
export type PermissionCheckers<
    Perms extends Permissions,
    Params extends PermsCheckersData<Perms>,
    Context
> = {
    [KF in keyof Perms]?: FunctionalityCheckers<Perms, Params, Context, KF>;
};

/**
 * The PermissionTable is used to define the permissions for each action in a functionality.
 *
 * Is the permissions are individual for all users, the object should be stored alongside the user membership entity.
 *
 * If the permissions adhere to roles of users, you can store these permissions in the role entity or in code - however you like.
 *
 * The object should contain the default value for each action and the conditions for each action.
 */
export type PermissionTable<Perms extends Permissions> = {
    [KP in keyof Perms]: {
        [KA in keyof Perms[KP]]: Perms[KP][KA][number] extends never
            ? {
                  default: boolean;
              }
            :
                  | {
                        default: true;
                    }
                  | {
                        default: boolean;
                        conditions?: {
                            [KC in Perms[KP][KA][number]]: boolean | undefined;
                        };
                    };
    };
};

/**
 * The FallbackPermissionTable is used to define the default permissions for each action in a functionality.
 *
 * The object should be stored and exported alongside the permissions type
 * as it provides the default values for each action.
 *
 * Ensure that the fallback table always has no permissions set,
 * as it is only a fallback for when the permissions table does not have the action or it's conditions stored.
 */
export type FallbackPermissionTable<Perms extends Permissions> = {
    [KP in keyof Perms]: {
        [KA in keyof Perms[KP] as Perms[KP][KA] extends Action ? KA : never]: {
            default: boolean;
            conditions: {
                [KC in Perms[KP][KA][number]]: boolean;
            };
        };
    };
};

export type PermissionCheckParameters<
    Perms extends Permissions,
    CheckersData extends PermsCheckersData<Perms>,
    KF extends keyof Perms,
    KA extends keyof Perms[KF]
> = [
    permissions:
        | PermissionTable<Perms>
        | (() => PermissionTable<Perms> | Promise<PermissionTable<Perms>>),
    key: `${string & KF}.${string & KA}`,
    ...args: ActionCheckerData<Perms, CheckersData, KF, KA> extends undefined
        ? [data?: undefined]
        : [data: ActionCheckerData<Perms, CheckersData, KF, KA>]
];

export class Permissioner<
    Perms extends Permissions,
    CheckersData extends PermsCheckersData<Perms>,
    Context = undefined
> {
    private fallbacks: FallbackPermissionTable<Perms>;
    private checker: PermissionCheckers<Perms, CheckersData, Context>;
    private context: Context;

    constructor(
        fallbacks: FallbackPermissionTable<Perms>,
        checker: PermissionCheckers<Perms, CheckersData, Context>,
        context: Context
    ) {
        this.fallbacks = fallbacks;
        this.checker = checker;
        this.context = context;
    }

    public async hasPermission<
        KF extends keyof Perms,
        KA extends keyof Perms[KF]
    >(
        ...[permissions, key, data]: PermissionCheckParameters<
            Perms,
            CheckersData,
            KF,
            KA
        >
    ): Promise<boolean> {
        const [functionality, action] = key.split(".") as [KF, KA];

        const perms =
            typeof permissions === "function"
                ? await permissions()
                : permissions;

        const actionKey = perms[functionality][action];

        if (actionKey.default === true) return true;

        const fallbackConditions =
            //@ts-expect-error Access via index type of the main model doesn't infer correctly here
            this.fallbacks[functionality][action].conditions;

        const conditions =
            "conditions" in actionKey ? actionKey.conditions ?? {} : {};

        // Make sure that we remove deprecated keys from this entry.
        for (const cond in conditions) {
            if (!(cond in fallbackConditions)) {
                // @ts-expect-error TS breaks down here...
                delete conditions[cond];
            }
        }

        const mergedConditions = {
            ...fallbackConditions,
            ...conditions
        };

        if (Object.values(mergedConditions).some((cond) => cond === true)) {
            const checker = this.checker[functionality]?.[action] as
                | ActionChecker<Perms, CheckersData, Context, KF, KA>
                | undefined;

            const result =
                (await checker?.(
                    this.context,
                    mergedConditions,
                    data as ActionCheckerData<Perms, CheckersData, KF, KA>
                )) ?? false;

            return result;
        }

        return false;
    }
}
