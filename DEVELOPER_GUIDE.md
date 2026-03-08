# Developer Guide — KPI Definitions, FY Handling & Extension

## Architecture Overview

```
src/lib/
├── businessConfig.ts    ← Single source of truth for business rules
├── kpiEngine.ts         ← Pure KPI calculation functions
├── chartEngine.ts       ← Pure chart-data generation functions
├── formatters.ts        ← Shared formatting & parsing utilities
├── types.ts             ← TypeScript interfaces
├── excelParser.ts       ← Excel file parsing & validation
├── templateGenerator.ts ← Download template generation
├── config.ts            ← Deployment/file config
└── demoData.ts          ← Demo dataset generator

src/contexts/
└── DataContext.tsx       ← React state: employees, filters, dates

src/components/dashboard/
├── PeopleSection.tsx     ← People Snapshot tab
├── JoinersSection.tsx    ← Hiring tab
├── AttritionSection.tsx  ← Attrition tab
├── OrganizationSection.tsx
├── DemographicsSection.tsx
└── TalentProfileSection.tsx
```

---

## Centralized Business Configuration

All tuneable business rules live in **`src/lib/businessConfig.ts`**:

| Setting | Default | Purpose |
|---|---|---|
| `FY_START_MONTH` | `3` (April) | Zero-indexed month that starts the fiscal year |
| `ROLLING_FY_COUNT` | `5` | Number of FYs shown in trend charts |
| `PCT_DECIMALS` | `1` | Decimal places for percentage KPIs |
| `CTC_TO_LAKHS` | `100000` | Divisor for CTC → Lakhs conversion |
| `CTC_TO_CRORES` | `10000000` | Divisor for CTC → Crores conversion |
| `ATTRITION_PCT_BASE` | `'headcount'` | Denominator for attrition sub-type %: `'headcount'` or `'exits'` |
| `TRAINING_HOURS_MODE` | `'total'` | Show total or average training hours: `'total'` or `'average'` |

### Changing the Fiscal Year

To switch to calendar-year (Jan–Dec):
```ts
export const FY_START_MONTH = 0; // January
```

All KPIs, charts, and FY labels will automatically adjust.

---

## Fiscal Year Handling

### Core Functions (businessConfig.ts)

- **`getFiscalYear(date)`** — Returns `{fyStart, fyEnd}` for any date
- **`dateToFYStartYear(date)`** — Maps a date to the FY start year (e.g., Jan 2025 → 2024 for Apr–Mar FY)
- **`fyLabel(startYear)`** — Produces display label like `"FY-2025"` for startYear 2024
- **`fyBounds(startYear)`** — Returns `{start, end}` dates for a given FY

### How FY Flows Through the App

1. User selects "Today" or a custom date → `asOfDate` in DataContext
2. `DataContext` calls `getFiscalYear(asOfDate)` → `fyStart`, `fyEnd`
3. These are passed to all section components as props
4. KPI/chart functions use them to filter employees

---

## KPI Definitions

### People Snapshot (8 KPIs)

| KPI | Formula | Unit |
|---|---|---|
| Total Employees | Count active as of `asOfDate` | Count |
| New Hires (FY) | Count where `date_of_joining ∈ [fyStart, fyEnd]` | Count |
| Total Exits (FY) | Count where `date_of_exit ∈ [fyStart, fyEnd]` | Count |
| Average Age | Mean of `(asOfDate − date_of_birth) / 365.25` for active | Years (floor) |
| Average Tenure | Mean of `(asOfDate − date_of_joining) / 365.25` for active | Years (1dp) |
| Average Experience | Mean of `total_exp_yrs` for active | Years (1dp) |
| Training Hours | Sum of `training_hours` for active (configurable to average) | Hours |
| Avg Satisfaction | Mean of `satisfaction_score` for active | Score (1dp) |

### Hiring (8 KPIs)

| KPI | Formula | Unit |
|---|---|---|
| Total New Joiners | Count joiners in FY | Count |
| Average Age | Mean age of joiners | Years (1dp) |
| Average Experience | Mean `total_exp_yrs` of joiners | Years (1dp) |
| Average CTC | Mean `total_ctc_pa / 100000` of joiners | Lakhs (1dp) |
| % Freshers | `(joiners with exp < 1) / total joiners × 100` | % |
| M:F Ratio | `males:females` string | Ratio |
| Top Hiring Source | Mode of `hiring_source` | Text |
| Top Hiring Zone | Mode of `zone` | Text |

### Attrition (8 KPIs)

| KPI | Formula | Denominator |
|---|---|---|
| Total Attrition % | `exits / avgHC × 100` | Avg headcount |
| Regrettable % | `regrettable exits / denom × 100` | Configurable (headcount or exits) |
| Non-Regret % | `non-regrettable exits / denom × 100` | Same as above |
| Retirement % | `retirement exits / denom × 100` | Same as above |
| Avg Tenure (Exited) | Mean tenure of exited employees | N/A |
| Top Exit Region | Mode of `zone` among exits | N/A |
| High Perf Attrition % | `excellent-rated exits / denom × 100` | Same as above |
| Top Talent Attrition % | `top_talent=yes exits / denom × 100` | Same as above |

**Average Headcount** = (Opening HC + Closing HC) / 2
- Opening HC: active at `fyStart`
- Closing HC: active at `fyEnd`

---

## Data Validation

On upload, `excelParser.ts` checks:
1. **Missing columns** — compared against `REQUIRED_COLUMNS` list
2. **Duplicate IDs** — count of non-unique `employee_id` values
3. **Invalid dates** — cells that fail `parseDate()` in date columns
4. **Invalid numbers** — cells that fail `parseNum()` in numeric columns
5. **Null rates** — percentage of null/empty values per required column

Results are displayed in the upload confirmation card and the dashboard header.

---

## Extending the System

### Adding a New KPI

1. Add the field to `PeopleKPIs` / `JoinersKPIs` / `AttritionKPIs` in `types.ts`
2. Compute it in the corresponding function in `kpiEngine.ts`
3. Add the KPI card in the section component (e.g., `PeopleSection.tsx`)
4. Add a unit test in `src/test/kpiEngine.test.ts`

### Adding a New Chart

1. Create a private function in `chartEngine.ts` returning `ChartSpec`
2. Add it to the relevant `compute*Charts()` public function
3. It will auto-render via `<SmartChart>`
4. Add a test in `src/test/chartEngine.test.ts`

### Adding a New Filter

1. Add the field to the `Employee` interface in `types.ts`
2. Add an entry to `FILTER_FIELDS` in `types.ts`
3. Map the column in `rowToEmployee()` in `excelParser.ts`
4. The filter will auto-appear in the FilterBar

---

## Testing

Run all tests:
```bash
npm test
```

### Test Files

| File | Coverage |
|---|---|
| `businessConfig.test.ts` | FY calculation, boundary cases |
| `formatters.test.ts` | Date parsing, number formatting, string utils |
| `kpiEngine.test.ts` | All 3 KPI functions, edge cases, empty data |
| `chartEngine.test.ts` | FY boundary correctness, chart spec structure |

### Manual Test Checklist

- [ ] Load demo data → verify 200 active, ~50 exits
- [ ] Set custom date to Jan 2024 → FY should show Apr 2023 – Mar 2024
- [ ] Reset to "Today" → FY should show current FY
- [ ] Apply Zone: North → all KPIs and charts should update
- [ ] Clear filters → numbers should restore
- [ ] Download Dashboard PPT → verify file generates
- [ ] Download Template → verify 76 columns
- [ ] Switch between all 6 tabs → no errors in console
