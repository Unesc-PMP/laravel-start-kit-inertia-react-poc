<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Validation\Rule;

/**
 * Regras de validação alinhadas com {@see \App\Http\Controllers\WorkflowFormController::submit}
 * para campos de um passo form_step.
 */
final class WorkflowFormFieldRules
{
    /**
     * @param  list<array<string, mixed>>  $fields
     * @return array<string, list<string>>
     */
    public static function rulesForSubmit(array $fields): array
    {
        $rules = [];
        foreach ($fields as $field) {
            if (! is_array($field) || ! isset($field['key'])) {
                continue;
            }

            $key = (string) $field['key'];
            $rules[$key] = self::rulesForSingleField($field);
        }

        return $rules;
    }

    /**
     * @param  array<string, mixed>  $field
     * @return list<string>
     */
    public static function rulesForSingleField(array $field): array
    {
        $type = (string) ($field['type'] ?? 'string');
        $required = filter_var($field['required'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $fieldRules = [];
        if ($required) {
            $fieldRules[] = 'required';
        } else {
            $fieldRules[] = 'nullable';
        }

        return match ($type) {
            'email' => array_merge($fieldRules, ['string', 'email']),
            'number' => array_merge($fieldRules, ['numeric']),
            'boolean' => $required
                ? ['accepted']
                : array_merge($fieldRules, ['boolean']),
            'textarea', 'string' => array_merge($fieldRules, ['string']),
            'select' => self::rulesForSelect($fieldRules, $field),
            'choice_cards' => self::rulesForChoiceCards($fieldRules, $field),
            default => array_merge($fieldRules, ['string']),
        };
    }

    /**
     * @param  list<string>  $fieldRules
     * @param  array<string, mixed>  $field
     * @return list<string>
     */
    private static function rulesForSelect(array $fieldRules, array $field): array
    {
        $opts = self::selectOptionsFromCsv($field['options'] ?? '');

        if ($opts === []) {
            return array_merge($fieldRules, ['string']);
        }

        return array_merge($fieldRules, ['string', Rule::in($opts)]);
    }

    /**
     * @param  list<string>  $fieldRules
     * @param  array<string, mixed>  $field
     * @return list<string>
     */
    private static function rulesForChoiceCards(array $fieldRules, array $field): array
    {
        $values = [];
        $choices = $field['choices'] ?? [];
        if (is_array($choices)) {
            foreach ($choices as $row) {
                if (is_array($row) && isset($row['value']) && is_string($row['value']) && $row['value'] !== '') {
                    $values[] = $row['value'];
                }
            }
        }

        if ($values === []) {
            return array_merge($fieldRules, ['string']);
        }

        return array_merge($fieldRules, ['string', Rule::in($values)]);
    }

    /**
     * @return list<string>
     */
    private static function selectOptionsFromCsv(mixed $csv): array
    {
        if (! is_string($csv) || $csv === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $csv))));
    }
}
