import React, { useState } from 'react';
import type { Lead, Sba504LoanData, LoanStatus } from '@leads/shared';

interface LoanDetailFormProps {
    lead: Lead;
    onSave: (updatedLead: Lead) => void;
    onClose: () => void;
}

type TabId = 'borrower' | 'property' | 'structure' | 'rates' | 'approvals' | 'closing' | 'insurance' | 'servicing';

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'borrower', label: 'Borrower', icon: '👤' },
    { id: 'property', label: 'Property', icon: '🏢' },
    { id: 'structure', label: 'Structure', icon: '💰' },
    { id: 'rates', label: 'Rates', icon: '📊' },
    { id: 'approvals', label: 'Approvals', icon: '✅' },
    { id: 'closing', label: 'Closing', icon: '📝' },
    { id: 'insurance', label: 'Insurance', icon: '🛡️' },
    { id: 'servicing', label: 'Servicing', icon: '📈' },
];

export const LoanDetailForm: React.FC<LoanDetailFormProps> = ({ lead, onSave, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabId>('borrower');
    const [loanData, setLoanData] = useState<Sba504LoanData>(lead.sba504 || {});
    const [isSaving, setIsSaving] = useState(false);

    const updateLoanData = (section: keyof Sba504LoanData, field: string, value: any) => {
        setLoanData(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as any || {}),
                [field]: value
            }
        }));
    };

    const updateTopLevel = (field: string, value: any) => {
        setLoanData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                ...lead,
                sba504: loanData
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="loan-detail-form">
            {/* Header */}
            <div className="loan-form-header">
                <div className="loan-form-title">
                    <h2>{lead.company || `${lead.firstName} ${lead.lastName}`}</h2>
                    <span className="loan-id">Project ID: {loanData.projectId || 'Not Assigned'}</span>
                </div>
                <div className="loan-form-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            <div className="loan-status-bar">
                <label>Loan Status:</label>
                <select
                    value={loanData.loanStatus || 'prospect'}
                    onChange={(e) => updateTopLevel('loanStatus', e.target.value as LoanStatus)}
                    className="status-select"
                >
                    <option value="prospect">Prospect</option>
                    <option value="application">Application</option>
                    <option value="processing">Processing</option>
                    <option value="committee_review">Committee Review</option>
                    <option value="president_approval">President Approval</option>
                    <option value="board_ratify">Board Ratify</option>
                    <option value="sba_submitted">SBA Submitted</option>
                    <option value="sba_authorized">SBA Authorized</option>
                    <option value="closing">Closing</option>
                    <option value="funded">Funded</option>
                    <option value="servicing">Servicing</option>
                    <option value="paid_off">Paid Off</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="charged_off">Charged Off</option>
                    <option value="liquidated">Liquidated</option>
                </select>
            </div>

            {/* Tabs */}
            <div className="loan-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`loan-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="loan-tab-content">
                {activeTab === 'borrower' && (
                    <BorrowerTab
                        data={loanData.borrower || {}}
                        onChange={(field, value) => updateLoanData('borrower', field, value)}
                        topLevel={{ bdo: loanData.bdo, loanProcessor: loanData.loanProcessor }}
                        onTopLevelChange={updateTopLevel}
                    />
                )}
                {activeTab === 'property' && (
                    <PropertyTab
                        data={loanData.project || {}}
                        characteristics={loanData.characteristics || {}}
                        onChange={(field, value) => updateLoanData('project', field, value)}
                        onCharacteristicsChange={(field, value) => updateLoanData('characteristics', field, value)}
                    />
                )}
                {activeTab === 'structure' && (
                    <StructureTab
                        data={loanData.financial || {}}
                        jobs={loanData.jobs || {}}
                        onChange={(field, value) => updateLoanData('financial', field, value)}
                        onJobsChange={(field, value) => updateLoanData('jobs', field, value)}
                    />
                )}
                {activeTab === 'rates' && (
                    <RatesTab
                        data={loanData.rates || {}}
                        lenders={loanData.lenders || {}}
                        onChange={(field, value) => updateLoanData('rates', field, value)}
                        onLendersChange={(field, value) => updateLoanData('lenders', field, value)}
                    />
                )}
                {activeTab === 'approvals' && (
                    <ApprovalsTab
                        data={loanData.approvals || {}}
                        risk={loanData.risk || {}}
                        onChange={(field, value) => updateLoanData('approvals', field, value)}
                        onRiskChange={(field, value) => updateLoanData('risk', field, value)}
                    />
                )}
                {activeTab === 'closing' && (
                    <ClosingTab
                        funding={loanData.funding || {}}
                        sba327={loanData.sba327 || {}}
                        ucc={loanData.ucc || {}}
                        compliance={loanData.compliance || {}}
                        onFundingChange={(field, value) => updateLoanData('funding', field, value)}
                        onSba327Change={(field, value) => updateLoanData('sba327', field, value)}
                        onUccChange={(field, value) => updateLoanData('ucc', field, value)}
                        onComplianceChange={(field, value) => updateLoanData('compliance', field, value)}
                    />
                )}
                {activeTab === 'insurance' && (
                    <InsuranceTab
                        data={loanData.insurance || {}}
                        onChange={(field, value) => updateLoanData('insurance', field, value)}
                    />
                )}
                {activeTab === 'servicing' && (
                    <ServicingTab
                        data={loanData.servicing || {}}
                        onChange={(field, value) => updateLoanData('servicing', field, value)}
                    />
                )}
            </div>
        </div>
    );
};

// ============================================
// TAB COMPONENTS
// ============================================

interface BorrowerTabProps {
    data: any;
    onChange: (field: string, value: any) => void;
    topLevel: { bdo?: string; loanProcessor?: string };
    onTopLevelChange: (field: string, value: any) => void;
}

const BorrowerTab: React.FC<BorrowerTabProps> = ({ data, onChange, topLevel, onTopLevelChange }) => (
    <div className="form-section">
        <h3>Borrower Information</h3>
        <div className="form-grid">
            <FormField label="Borrower Name" value={data.borrowerName} onChange={(v) => onChange('borrowerName', v)} />
            <FormField label="DBA" value={data.dba} onChange={(v) => onChange('dba', v)} />
            <FormField label="Operating Company" value={data.operatingCompany} onChange={(v) => onChange('operatingCompany', v)} />
            <FormField label="EPC (Eligible Passive Company)" value={data.epc} onChange={(v) => onChange('epc', v)} />
        </div>

        <h3>Assignment</h3>
        <div className="form-grid">
            <FormField label="BDO" value={topLevel.bdo} onChange={(v) => onTopLevelChange('bdo', v)} />
            <FormField label="Loan Processor" value={topLevel.loanProcessor} onChange={(v) => onTopLevelChange('loanProcessor', v)} />
        </div>
    </div>
);

interface PropertyTabProps {
    data: any;
    characteristics: any;
    onChange: (field: string, value: any) => void;
    onCharacteristicsChange: (field: string, value: any) => void;
}

const PropertyTab: React.FC<PropertyTabProps> = ({ data, characteristics, onChange, onCharacteristicsChange }) => (
    <div className="form-section">
        <h3>Project Property</h3>
        <div className="form-grid">
            <FormField label="APN (Assessor's Parcel #)" value={data.apn} onChange={(v) => onChange('apn', v)} />
            <FormField label="Street #" value={data.streetNumber} onChange={(v) => onChange('streetNumber', v)} width="small" />
            <FormField label="Street Name" value={data.streetName} onChange={(v) => onChange('streetName', v)} />
            <FormField label="Suite #" value={data.suiteNumber} onChange={(v) => onChange('suiteNumber', v)} width="small" />
            <FormField label="City" value={data.city} onChange={(v) => onChange('city', v)} />
            <FormField label="State" value={data.state} onChange={(v) => onChange('state', v)} width="small" />
            <FormField label="County" value={data.county} onChange={(v) => onChange('county', v)} />
            <FormField label="ZIP Code" value={data.zipCode} onChange={(v) => onChange('zipCode', v)} width="small" />
            <FormField label="Congressional District" value={data.congressionalDistrict} onChange={(v) => onChange('congressionalDistrict', v)} />
            <FormField label="Website" value={data.webPage} onChange={(v) => onChange('webPage', v)} />
        </div>

        <h3>Loan Characteristics</h3>
        <div className="checkbox-grid">
            <CheckboxField label="Purchase" checked={characteristics.isPurchase} onChange={(v) => onCharacteristicsChange('isPurchase', v)} />
            <CheckboxField label="Construction" checked={characteristics.isConstruction} onChange={(v) => onCharacteristicsChange('isConstruction', v)} />
            <CheckboxField label="Equipment" checked={characteristics.isEquipment} onChange={(v) => onCharacteristicsChange('isEquipment', v)} />
            <CheckboxField label="Life Insurance Required" checked={characteristics.hasLifeInsurance} onChange={(v) => onCharacteristicsChange('hasLifeInsurance', v)} />
            <CheckboxField label="Ground Leased" checked={characteristics.isGroundLeased} onChange={(v) => onCharacteristicsChange('isGroundLeased', v)} />
            <CheckboxField label="Flood Zone" checked={characteristics.isFloodZone} onChange={(v) => onCharacteristicsChange('isFloodZone', v)} />
            <CheckboxField label="Startup (<2 years)" checked={characteristics.isStartup} onChange={(v) => onCharacteristicsChange('isStartup', v)} />
            <CheckboxField label="Refinance >50%" checked={characteristics.isRefinance50} onChange={(v) => onCharacteristicsChange('isRefinance50', v)} />
            <CheckboxField label="Refinance" checked={characteristics.isRefinance} onChange={(v) => onCharacteristicsChange('isRefinance', v)} />
            <CheckboxField label="Franchise" checked={characteristics.isFranchise} onChange={(v) => onCharacteristicsChange('isFranchise', v)} />
        </div>
        {characteristics.isFranchise && (
            <FormField label="Franchise Name" value={characteristics.franchiseName} onChange={(v) => onCharacteristicsChange('franchiseName', v)} />
        )}
    </div>
);

interface StructureTabProps {
    data: any;
    jobs: any;
    onChange: (field: string, value: any) => void;
    onJobsChange: (field: string, value: any) => void;
}

const StructureTab: React.FC<StructureTabProps> = ({ data, jobs, onChange, onJobsChange }) => (
    <div className="form-section">
        <h3>Financial Structure</h3>
        <div className="form-grid">
            <CurrencyField label="Total Project" value={data.totalProject} onChange={(v) => onChange('totalProject', v)} />
            <CurrencyField label="Third Party 1st" value={data.thirdParty1st} onChange={(v) => onChange('thirdParty1st', v)} />
            <CurrencyField label="Net Debenture" value={data.netDebenture} onChange={(v) => onChange('netDebenture', v)} />
            <CurrencyField label="Interim Loan" value={data.interim} onChange={(v) => onChange('interim', v)} />
            <CurrencyField label="Borrower Down" value={data.borrowerDown} onChange={(v) => onChange('borrowerDown', v)} />
            <CurrencyField label="Gross Debenture" value={data.grossDebenture} onChange={(v) => onChange('grossDebenture', v)} />
        </div>

        <h3>Fees</h3>
        <div className="form-grid">
            <CurrencyField label="Origination Fee" value={data.originationFee} onChange={(v) => onChange('originationFee', v)} />
            <CurrencyField label="Servicing Fee" value={data.servicingFee} onChange={(v) => onChange('servicingFee', v)} />
            <CurrencyField label="Closing Fee" value={data.closingFee} onChange={(v) => onChange('closingFee', v)} />
            <CurrencyField label="SBA 1/2 Point" value={data.sbaHalfPoint} onChange={(v) => onChange('sbaHalfPoint', v)} />
            <DateField label="1/2 Point Received" value={data.halfPointDateReceived} onChange={(v) => onChange('halfPointDateReceived', v)} />
        </div>

        <h3>Jobs Impact (SBA Requirement)</h3>
        <div className="form-grid">
            <NumberField label="Jobs Before Project" value={jobs.jobsBeforeProject} onChange={(v) => onJobsChange('jobsBeforeProject', v)} />
            <NumberField label="Jobs Created" value={jobs.jobsCreated} onChange={(v) => onJobsChange('jobsCreated', v)} />
            <NumberField label="Jobs Retained" value={jobs.jobsRetained} onChange={(v) => onJobsChange('jobsRetained', v)} />
            <NumberField label="2-Year Projected" value={jobs.jobs2YrsProjected} onChange={(v) => onJobsChange('jobs2YrsProjected', v)} />
            <NumberField label="2-Year Actual" value={jobs.jobs2YrsActual} onChange={(v) => onJobsChange('jobs2YrsActual', v)} />
        </div>
    </div>
);

interface RatesTabProps {
    data: any;
    lenders: any;
    onChange: (field: string, value: any) => void;
    onLendersChange: (field: string, value: any) => void;
}

const RatesTab: React.FC<RatesTabProps> = ({ data, lenders, onChange, onLendersChange }) => (
    <div className="form-section">
        <h3>Interest Rates</h3>
        <div className="form-grid">
            <PercentField label="Debenture Rate" value={data.debentureRate} onChange={(v) => onChange('debentureRate', v)} />
            <PercentField label="CDC Note Rate" value={data.cdcNoteRate} onChange={(v) => onChange('cdcNoteRate', v)} />
            <PercentField label="1st Note Rate" value={data.firstNoteRate} onChange={(v) => onChange('firstNoteRate', v)} />
            <FormField label="1st Loan Index" value={data.firstLoanIndex} onChange={(v) => onChange('firstLoanIndex', v)} />
            <PercentField label="Interim Loan Rate" value={data.interimLoanRate} onChange={(v) => onChange('interimLoanRate', v)} />
            <FormField label="Interim Loan Index" value={data.interimLoanIndex} onChange={(v) => onChange('interimLoanIndex', v)} />
        </div>

        <h3>Lender Information</h3>
        <div className="form-grid">
            <FormField label="First Lender" value={lenders.firstLender} onChange={(v) => onLendersChange('firstLender', v)} />
            <FormField label="First Lender Contact" value={lenders.firstLenderContact} onChange={(v) => onLendersChange('firstLenderContact', v)} />
            <FormField label="Interim Lender" value={lenders.interimLender} onChange={(v) => onLendersChange('interimLender', v)} />
            <FormField label="Interim Lender Contact" value={lenders.interimLenderContact} onChange={(v) => onLendersChange('interimLenderContact', v)} />
        </div>
    </div>
);

interface ApprovalsTabProps {
    data: any;
    risk: any;
    onChange: (field: string, value: any) => void;
    onRiskChange: (field: string, value: any) => void;
}

const ApprovalsTab: React.FC<ApprovalsTabProps> = ({ data, risk, onChange, onRiskChange }) => (
    <div className="form-section">
        <h3>Approval Workflow</h3>
        <div className="form-grid">
            <DateField label="Loan Committee Approval" value={data.loanCommitteeApproval} onChange={(v) => onChange('loanCommitteeApproval', v)} />
            <DateField label="President Approval" value={data.presidentApproval} onChange={(v) => onChange('presidentApproval', v)} />
            <DateField label="Board Ratify" value={data.boardRatify} onChange={(v) => onChange('boardRatify', v)} />
            <DateField label="Board Approval" value={data.boardApproval} onChange={(v) => onChange('boardApproval', v)} />
            <DateField label="Date to SBA" value={data.dateToSba} onChange={(v) => onChange('dateToSba', v)} />
            <DateField label="Auth Date" value={data.authDate} onChange={(v) => onChange('authDate', v)} />
            <FormField label="Auth Number" value={data.authNumber} onChange={(v) => onChange('authNumber', v)} />
        </div>

        <h3>Risk Assessment</h3>
        <div className="form-grid">
            <div className="form-field">
                <label>Loan Risk</label>
                <select
                    value={risk.loanRisk || ''}
                    onChange={(e) => onRiskChange('loanRisk', e.target.value)}
                >
                    <option value="">Select...</option>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                    <option value="very_high">Very High Risk</option>
                </select>
            </div>
            <NumberField label="Application Rating (1-5)" value={risk.applicationLoanRating} onChange={(v) => onRiskChange('applicationLoanRating', v)} />
            <NumberField label="Servicing Rating (1-5)" value={risk.servicingLoanRating} onChange={(v) => onRiskChange('servicingLoanRating', v)} />
        </div>
        <FormField label="Risk Notes" value={risk.riskNotes} onChange={(v) => onRiskChange('riskNotes', v)} multiline />
    </div>
);

interface ClosingTabProps {
    funding: any;
    sba327: any;
    ucc: any;
    compliance: any;
    onFundingChange: (field: string, value: any) => void;
    onSba327Change: (field: string, value: any) => void;
    onUccChange: (field: string, value: any) => void;
    onComplianceChange: (field: string, value: any) => void;
}

const ClosingTab: React.FC<ClosingTabProps> = ({
    funding, sba327, ucc, compliance,
    onFundingChange, onSba327Change, onUccChange, onComplianceChange
}) => (
    <div className="form-section">
        <h3>Funding Milestones</h3>
        <div className="form-grid">
            <DateField label="Bank Record Date" value={funding.bankRecordDate} onChange={(v) => onFundingChange('bankRecordDate', v)} />
            <DateField label="Bank Fund Date" value={funding.bankFundDate} onChange={(v) => onFundingChange('bankFundDate', v)} />
            <DateField label="Escrow Close Date" value={funding.escrowCloseDate} onChange={(v) => onFundingChange('escrowCloseDate', v)} />
            <DateField label="CDC Signing Date" value={funding.cdcSigningDate} onChange={(v) => onFundingChange('cdcSigningDate', v)} />
            <DateField label="CDC Fund Date" value={funding.cdcFundDate} onChange={(v) => onFundingChange('cdcFundDate', v)} />
            <DateField label="Notice of Completion" value={funding.noticeOfCompletion} onChange={(v) => onFundingChange('noticeOfCompletion', v)} />
            <DateField label="Reconveyance Received" value={funding.reconveyanceRecvdDate} onChange={(v) => onFundingChange('reconveyanceRecvdDate', v)} />
        </div>

        <h3>SBA 327 Forms</h3>
        <div className="form-grid">
            <DateField label="SBA 327-1" value={sba327.sba327_1} onChange={(v) => onSba327Change('sba327_1', v)} />
            <DateField label="SBA 327-2" value={sba327.sba327_2} onChange={(v) => onSba327Change('sba327_2', v)} />
            <DateField label="SBA 327-3" value={sba327.sba327_3} onChange={(v) => onSba327Change('sba327_3', v)} />
            <DateField label="SBA 327-4" value={sba327.sba327_4} onChange={(v) => onSba327Change('sba327_4', v)} />
        </div>

        <h3>UCC Filing</h3>
        <div className="form-grid">
            <DateField label="UCC Filing Date" value={ucc.uccFilingDate} onChange={(v) => onUccChange('uccFilingDate', v)} />
            <DateField label="Continuation Filing Date" value={ucc.uccContinuationFilingDate} onChange={(v) => onUccChange('uccContinuationFilingDate', v)} />
            <FormField label="UCC Filing No" value={ucc.uccFilingNo} onChange={(v) => onUccChange('uccFilingNo', v)} />
        </div>

        <h3>Environmental & Appraisal</h3>
        <div className="form-grid">
            <DateField label="Env. Date Approved" value={compliance.envDateApproved} onChange={(v) => onComplianceChange('envDateApproved', v)} />
            <DateField label="Env. Report Date" value={compliance.envDateOfReport} onChange={(v) => onComplianceChange('envDateOfReport', v)} />
            <DateField label="Appraisal Approved" value={compliance.appDateApproved} onChange={(v) => onComplianceChange('appDateApproved', v)} />
            <DateField label="Appraisal Date" value={compliance.appDate} onChange={(v) => onComplianceChange('appDate', v)} />
        </div>
    </div>
);

interface InsuranceTabProps {
    data: any;
    onChange: (field: string, value: any) => void;
}

const InsuranceTab: React.FC<InsuranceTabProps> = ({ data, onChange }) => (
    <div className="form-section">
        <h3>Insurance Information</h3>
        <div className="form-grid">
            <FormField label="Policy Number" value={data.insCoPolicyNo} onChange={(v) => onChange('insCoPolicyNo', v)} />
            <DateField label="Expiration Date" value={data.insExpDate} onChange={(v) => onChange('insExpDate', v)} />
            <FormField label="Insurance Company" value={data.insCoName} onChange={(v) => onChange('insCoName', v)} />
            <FormField label="Agent Name" value={data.insCoAgentName} onChange={(v) => onChange('insCoAgentName', v)} />
            <FormField label="Agent Phone" value={data.insPhone} onChange={(v) => onChange('insPhone', v)} />
            <FormField label="Agent Fax" value={data.insFax} onChange={(v) => onChange('insFax', v)} />
            <FormField label="Agent Email" value={data.insEmail} onChange={(v) => onChange('insEmail', v)} />
        </div>
    </div>
);

interface ServicingTabProps {
    data: any;
    onChange: (field: string, value: any) => void;
}

const ServicingTab: React.FC<ServicingTabProps> = ({ data, onChange }) => (
    <div className="form-section">
        <h3>Current Status</h3>
        <div className="form-grid">
            <CurrencyField label="Principal Balance" value={data.principleBalance} onChange={(v) => onChange('principleBalance', v)} />
            <DateField label="Last Date Paid" value={data.lastDatePaid} onChange={(v) => onChange('lastDatePaid', v)} />
            <DateField label="Last Site Visit" value={data.lastSiteVisit} onChange={(v) => onChange('lastSiteVisit', v)} />
        </div>

        <h3>Disposition</h3>
        <div className="form-grid">
            <DateField label="Paid Off Date" value={data.paidDate} onChange={(v) => onChange('paidDate', v)} />
            <DateField label="Cancelled Date" value={data.cancelledDate} onChange={(v) => onChange('cancelledDate', v)} />
            <DateField label="Liquidation Date" value={data.liquidationDate} onChange={(v) => onChange('liquidationDate', v)} />
            <CurrencyField label="Liquidation Balance" value={data.liquidationBalance} onChange={(v) => onChange('liquidationBalance', v)} />
            <DateField label="Charge Off Date" value={data.chargeOffDate} onChange={(v) => onChange('chargeOffDate', v)} />
            <CurrencyField label="Charge Off Balance" value={data.chargeOffBalance} onChange={(v) => onChange('chargeOffBalance', v)} />
            <CurrencyField label="Short Sale Balance" value={data.shortSaleBalance} onChange={(v) => onChange('shortSaleBalance', v)} />
        </div>
    </div>
);

// ============================================
// FORM FIELD COMPONENTS
// ============================================

interface FormFieldProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    width?: 'small' | 'medium' | 'full';
    multiline?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, value, onChange, width, multiline }) => (
    <div className={`form-field ${width || ''}`}>
        <label>{label}</label>
        {multiline ? (
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
            />
        ) : (
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            />
        )}
    </div>
);

interface CurrencyFieldProps {
    label: string;
    value?: number;
    onChange: (value: number) => void;
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({ label, value, onChange }) => (
    <div className="form-field">
        <label>{label}</label>
        <div className="currency-input">
            <span className="currency-symbol">$</span>
            <input
                type="number"
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            />
        </div>
    </div>
);

interface NumberFieldProps {
    label: string;
    value?: number;
    onChange: (value: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({ label, value, onChange }) => (
    <div className="form-field">
        <label>{label}</label>
        <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        />
    </div>
);

interface PercentFieldProps {
    label: string;
    value?: number;
    onChange: (value: number) => void;
}

const PercentField: React.FC<PercentFieldProps> = ({ label, value, onChange }) => (
    <div className="form-field">
        <label>{label}</label>
        <div className="percent-input">
            <input
                type="number"
                step="0.01"
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            />
            <span className="percent-symbol">%</span>
        </div>
    </div>
);

interface DateFieldProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
}

const DateField: React.FC<DateFieldProps> = ({ label, value, onChange }) => (
    <div className="form-field">
        <label>{label}</label>
        <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

interface CheckboxFieldProps {
    label: string;
    checked?: boolean;
    onChange: (value: boolean) => void;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, checked, onChange }) => (
    <label className="checkbox-field">
        <input
            type="checkbox"
            checked={checked || false}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
    </label>
);

export default LoanDetailForm;
