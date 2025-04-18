import React, { useState } from 'react';
import { 
    TextField, 
    Button, 
    Box, 
    Typography, 
    Container, 
    Grid, 
    Paper, 
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Alert,
    FormHelperText,
    Checkbox,
    FormControlLabel,
    ListItemText
} from '@mui/material';
import Airtable from 'airtable';

// Airtable Configuration
const AIRTABLE_CONFIG = {
    BASE_ID: "appuxH2KKk6R6YF7x",
    TABLE_NAME: "Companies",
    API_KEY: "pat922WKdJzeMjXCH.05605d6ead1c04067b80e0ed4e002f398463b2735591486b4899e24b4dc1d1cb"
};

// LLM API Secrets
const LLM_SECRETS = {
    'Gemini 2.0 Flash': 'AIzaSyDGXaGAIf1E9okA2xUeiVwF6B-Z58E86sE',
    'Gemini 2.5 Pro': 'gemini_secret_key_placeholder',
    'OpenAI 4.0': 'openai_secret_key_placeholder',
    'Claude 3.7': 'claude_secret_key_placeholder',
    'LLaMA 4': 'llama_secret_key_placeholder'
};

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                    },
                },
            },
        },
    },
});

const FIELD_GROUPS = {
    "Airtable Configuration": {
        "base_id": "Base ID",
        "table_name": "Table Name"
    },
    "Prompts": {
        "Prompt1": "Prompt 1 (Required)",
        "Prompt2": "Prompt 2 (Optional)",
        "Prompt3": "Prompt 3 (Optional)",
        "Prompt4": "Prompt 4 (Optional)",
        "Prompt5": "Prompt 5 (Optional)",
        "Prompt6": "Prompt 6 (Optional)",
        "Prompt7": "Prompt 7 (Optional)",
        "Prompt8": "Prompt 8 (Optional)",
        "Prompt9": "Prompt 9 (Optional)",
        "Prompt10": "Prompt 10 (Optional)",
        "Relevance_Prompt": "Relevance Prompt (Required)"
    },
    "Company Information": {
        "Company": "Company (Required)",
        "Company Description": "Company Description",
        "Messages": "Messages"
    },
    "Octoparse Configuration (Optional)": {
        "OCTOPARSE_API_URL": "OCTOPARSE API URL",
        "OCTOPARSE_SECRET_NAME": "OCTOPARSE Secret Name",
        "octoparse_token": "Octoparse Token",
        "task_id": "Task ID",
        "task_size": {
            label: "Task Size",
            type: "number"
        }
    },
    "CSV Configuration (Optional)": {
        "csv_file_path": "CSV File Path",
        "csv_file_name": "CSV File Name"
    },
    "LLM Configuration": {
        "LLM_Selection": {
            label: "Analysis Models (Multi-select)",
            type: "multi-select",
            options: [
                { value: 'Gemini 2.0 Flash', label: 'Gemini 2.0 Flash' },
                { value: 'Gemini 2.5 Pro', label: 'Gemini 2.5 Pro' },
                { value: 'OpenAI 4.0', label: 'OpenAI 4.0' },
                { value: 'Claude 3.7', label: 'Claude 3.7' },
                { value: 'LLaMA 4', label: 'LLaMA 4' }
            ]
        },
        "relevance_model": "Relevance Model",
    }
};

const RELEVANCE_MODEL_OPTIONS = [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Default)' }
];

const DEFAULT_RELEVANCE_MODEL = 'gemini-2.0-flash';

const MESSAGES_INSTRUCTIONS = `Instructions: use exact format below in example text. Insert up to 8 messages:
M1: User Matching Accuracy
M2: Financial Safety
M3: Physical Safety
M4: Market Leadership and Growth
M5: Diversity and Inclusion
M6: Technology and Innovation
M7: New Products and Partnerships
M8: Policy Engagement`;

const FormComponent = () => {
    const [formData, setFormData] = useState({
        relevance_model: DEFAULT_RELEVANCE_MODEL,
        auto_execute: false,
        table_secret: AIRTABLE_CONFIG.API_KEY,
        LLM_Selection: [],
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let processedValue;
        if (type === 'number') {
            processedValue = value === '' ? '' : Number(value);
        } else if (type === 'checkbox') {
            processedValue = checked;
        } else {
            processedValue = value;
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));
        
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleMultiSelectChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: typeof value === 'string' ? value.split(',') : value,
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.Prompt1) newErrors.Prompt1 = 'Prompt 1 is required';
        if (!formData.Relevance_Prompt) newErrors.Relevance_Prompt = 'Relevance prompt is required';
        if (!formData.Company) newErrors.Company = 'Company name is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const prepareSubmissionData = () => {
        const submissionData = {
            ...formData,
            table_secret: AIRTABLE_CONFIG.API_KEY,
        };

        // Convert numeric fields
        if (formData.task_size) {
            submissionData.task_size = Number(formData.task_size);
        }
        if (formData.task_id) {
            submissionData.task_id = formData.task_id;
        }

        // Set LLM secrets for all selected models
        if (formData.LLM_Selection) {
            submissionData.llm_secret = LLM_SECRETS[formData.LLM_Selection] || '';
        }

        return submissionData;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSuccess(false);

        try {
            const base = new Airtable({ 
                apiKey: AIRTABLE_CONFIG.API_KEY,
                endpointUrl: 'https://api.airtable.com',
                apiVersion: '0.1.0',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`
                }
            }).base(AIRTABLE_CONFIG.BASE_ID);
            
            const submissionData = prepareSubmissionData();
            
            await base(AIRTABLE_CONFIG.TABLE_NAME).create([
                {
                    fields: submissionData
                }
            ]);

            setSuccess(true);
            setFormData({ 
                relevance_model: DEFAULT_RELEVANCE_MODEL,
                auto_execute: false,
                table_secret: AIRTABLE_CONFIG.API_KEY,
                LLM_Selection: [],
            });

            if (formData.auto_execute) {
                console.log("Auto-executing analysis with settings:", submissionData);
            }
        } catch (err) {
            setErrors({ submit: err.message });
            console.error('Error submitting to Airtable:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFieldRequired = (fieldKey) => {
        return fieldKey === 'Prompt1' || 
               fieldKey === 'Relevance_Prompt' || 
               fieldKey === 'Company';
    };

    const renderField = (fieldKey, fieldConfig) => {
        const fieldLabel = typeof fieldConfig === 'object' ? fieldConfig.label : fieldConfig;
        const fieldType = typeof fieldConfig === 'object' ? fieldConfig.type : 'text';

        switch (fieldType) {
            case 'multi-select':
                return (
                    <FormControl fullWidth>
                        <InputLabel>{fieldLabel}</InputLabel>
                        <Select
                            multiple
                            name={fieldKey}
                            value={formData[fieldKey] || []}
                            onChange={handleMultiSelectChange}
                            label={fieldLabel}
                            renderValue={(selected) => selected.join(', ')}
                            sx={{ borderRadius: '8px' }}
                        >
                            {fieldConfig.options.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Checkbox checked={formData[fieldKey]?.indexOf(option.value) > -1} />
                                    <ListItemText primary={option.label} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            case 'checkbox':
                return (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formData[fieldKey] || false}
                                onChange={handleChange}
                                name={fieldKey}
                                color="primary"
                            />
                        }
                        label={fieldLabel}
                    />
                );
            case 'number':
                return (
                    <TextField
                        fullWidth
                        label={fieldLabel}
                        name={fieldKey}
                        value={formData[fieldKey] || ''}
                        onChange={handleChange}
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0 } }}
                        sx={{ borderRadius: '8px' }}
                    />
                );
            default:
                return (
                    <TextField
                        fullWidth
                        label={fieldLabel}
                        name={fieldKey}
                        value={formData[fieldKey] || ''}
                        onChange={handleChange}
                        variant="outlined"
                        sx={{ borderRadius: '8px' }}
                        multiline={fieldKey.startsWith('Prompt') || fieldKey === 'Messages'}
                        rows={fieldKey.startsWith('Prompt') ? 3 : fieldKey === 'Messages' ? 8 : 1}
                        error={!!errors[fieldKey]}
                        helperText={errors[fieldKey]}
                        required={isFieldRequired(fieldKey)}
                    />
                );
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    py: 4
                }}
            >
                <Container maxWidth="md">
                    <Paper elevation={3} sx={{ p: 4, borderRadius: '12px' }}>
                        <Typography 
                            variant="h4" 
                            component="h1" 
                            gutterBottom 
                            align="center"
                            sx={{
                                mb: 4,
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Data Entry Form
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => (
                                <Paper
                                    key={groupName} 
                                    elevation={1} 
                                    sx={{ 
                                        p: 3, 
                                        mb: 3,
                                        bgcolor: 'background.paper'
                                    }}
                                >
                                    <Typography 
                                        variant="h6" 
                                        gutterBottom
                                        sx={{ 
                                            color: 'primary.main',
                                            fontWeight: 'medium'
                                        }}
                                    >
                                        {groupName}
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    {groupName === "Company Information" && fields["Messages"] && (
                                        <Alert severity="info" sx={{ mb: 3 }}>
                                            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                                {MESSAGES_INSTRUCTIONS}
                                            </Typography>
                                        </Alert>
                                    )}
                                    {groupName === "LLM Configuration" && (
                                        <Alert severity="info" sx={{ mb: 3 }}>
                                            <Typography variant="body2">
                                                <strong>Relevance Model:</strong> Always uses Gemini 2.0 Flash for fast, cost-effective relevance checks.
                                                <br />
                                                <strong>Analysis Models:</strong> Select one or more models for complex analysis.
                                            </Typography>
                                        </Alert>
                                    )}
                                    <Grid container spacing={3}>
                                        {Object.entries(fields).map(([fieldKey, fieldConfig]) => (
                                            <Grid item xs={12} sm={6} key={fieldKey}>
                                                {fieldKey === "relevance_model" ? (
                                                    <FormControl fullWidth>
                                                        <InputLabel>{fieldConfig}</InputLabel>
                                                        <Select
                                                            name={fieldKey}
                                                            value={formData[fieldKey] || DEFAULT_RELEVANCE_MODEL}
                                                            onChange={handleChange}
                                                            label={fieldConfig}
                                                            sx={{ borderRadius: '8px' }}
                                                            disabled
                                                        >
                                                            {RELEVANCE_MODEL_OPTIONS.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    renderField(fieldKey, fieldConfig)
                                                )}
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            ))}

                            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.auto_execute}
                                            onChange={handleChange}
                                            name="auto_execute"
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                                Auto Execute Analysis
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Check this box to automatically start analysis after submission
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Paper>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={isSubmitting}
                                    sx={{
                                        px: 6,
                                        py: 1.5,
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                            </Box>
                        </form>
                        {errors.submit && (
                            <Typography 
                                color="error" 
                                sx={{ 
                                    mt: 2,
                                    textAlign: 'center',
                                    bgcolor: 'error.light',
                                    p: 1,
                                    borderRadius: '4px'
                                }}
                            >
                                Error: {errors.submit}
                            </Typography>
                        )}
                        {success && (
                            <Typography 
                                color="success.main" 
                                sx={{ 
                                    mt: 2,
                                    textAlign: 'center',
                                    bgcolor: 'success.light',
                                    p: 1,
                                    borderRadius: '4px'
                                }}
                            >
                                Data submitted successfully! {formData.auto_execute ? 'Analysis started automatically.' : ''}
                            </Typography>
                        )}
                    </Paper>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default FormComponent;