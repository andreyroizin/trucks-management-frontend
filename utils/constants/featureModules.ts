export type FeatureModuleId = 'base' | 'planning' | 'finance' | 'hr';

export type FeatureModuleConfig = {
    id: FeatureModuleId;
    labelKey: string;
    descriptionKey: string;
    alwaysOn: boolean;
    icon: string; // MUI icon name reference for the UI
};

export const FEATURE_MODULES: FeatureModuleConfig[] = [
    {
        id: 'base',
        labelKey: 'moduleToggles.modules.base.label',
        descriptionKey: 'moduleToggles.modules.base.description',
        alwaysOn: true,
        icon: 'Foundation',
    },
    {
        id: 'planning',
        labelKey: 'moduleToggles.modules.planning.label',
        descriptionKey: 'moduleToggles.modules.planning.description',
        alwaysOn: false,
        icon: 'CalendarToday',
    },
    {
        id: 'finance',
        labelKey: 'moduleToggles.modules.finance.label',
        descriptionKey: 'moduleToggles.modules.finance.description',
        alwaysOn: false,
        icon: 'AccountBalance',
    },
    {
        id: 'hr',
        labelKey: 'moduleToggles.modules.hr.label',
        descriptionKey: 'moduleToggles.modules.hr.description',
        alwaysOn: false,
        icon: 'People',
    },
];

export const TOGGLEABLE_MODULES = FEATURE_MODULES.filter((m) => !m.alwaysOn);
