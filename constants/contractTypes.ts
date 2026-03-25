export type ContractTypeValue = 'CAO' | 'ZZP' | 'Inleen' | 'BriefLoonschaal';

// Maps to backend enum integer values
export const CONTRACT_TYPE_VALUES: Record<ContractTypeValue, number> = {
    CAO: 0,
    ZZP: 1,
    Inleen: 2,
    BriefLoonschaal: 3,
};

// For display in forms and UI
export const CONTRACT_TYPE_OPTIONS: { value: ContractTypeValue; label: string; description: string }[] = [
    {
        value: 'CAO',
        label: 'CAO TLN',
        description: 'Collectieve Arbeidsovereenkomst — standaard loonschaal',
    },
    {
        value: 'ZZP',
        label: 'ZZP',
        description: 'Zelfstandige Zonder Personeel — freelance/zelfstandig ondernemer',
    },
    {
        value: 'Inleen',
        label: 'Inleen',
        description: 'Detachering — chauffeur ingeleend van een ander bedrijf',
    },
    {
        value: 'BriefLoonschaal',
        label: 'Brief Loonschaal',
        description: 'Vast maandsalaris conform arbeidsbrief (niet CAO-tabel)',
    },
];

export const CONTRACT_TYPE_COLORS: Record<ContractTypeValue, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    CAO: 'primary',
    ZZP: 'success',
    Inleen: 'warning',
    BriefLoonschaal: 'info',
};
