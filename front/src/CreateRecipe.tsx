import { useEffect, useState } from "react";
import { 
    TextField, 
    Button, 
    Container, 
    Typography, 
    Box, 
    IconButton
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';

function CreateRecipe() {
    interface FormData {
        name: string;
        category: string;
        area: string;
        instructions: string[];
        tags: string[];
        thumbnail: string;
    }

    const [formData, setFormData] = useState<FormData>({
        name: "",
        category: "",
        area: "",
        instructions: [""],
        tags: [],
        thumbnail: "",
    });
        
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<{ id: number; name: string }[]>([]);
    const [ingredientFields, setIngredientFields] = useState<{ name: string; measure: string }[]>([
        { name: "", measure: "" }
    ]);

    const tagOptions = [
        "Alcoholic", "BBQ", "Baking", "Beans", "Breakfast", "Brunch", "Bun", "Cake", "Calorific", "Caramel",
        "Casserole", "Celebration", "Cheap", "Cheesy", "Chilli", "Chocolate", "Christmas", "Curry", "Dairy", "DateNight",
        "Dessert", "DinnerParty", "Easter", "Egg", "Eid", "Expensive", "Fish", "Fresh", "Fruity", "Fusion",
        "Glazed", "Greasy", "Halloween", "HangoverFood", "Heavy", "HighFat", "Kebab", "Keto", "Light", "LowCalorie",
        "LowCarbs", "MainMeal", "Meat", "Mild", "Nutty", "Onthego", "Paella", "Paleo", "Pancake", "Party",
        "Pasta", "Pie", "Pulse", "Pudding", "Salad", "Sandwich", "Sausages", "Savory", "Seafood", "Shellfish",
        "SideDish", "Snack", "Soup", "Sour", "Speciality", "Spicy", "Stew", "Streetfood", "StrongFlavor", "Summer",
        "Sweet", "Tart", "Treat", "UnHealthy", "Vegan", "Vegetables", "Vegetarian", "Warm", "Warming"
    ];

    const categories = [
        "Beef", "Chicken", "Dessert", "Lamb", "Miscellaneous", "Pasta", "Pork", "Seafood", 
        "Side", "Starter", "Vegan", "Vegetarian", "Breakfast", "Goat", "Other"
    ];

    const areas = [
        "Algerian", "American", "Argentinian", "Australian", "British", "Canadian", "Chinese", "Croatian", "Dutch", 
        "Egyptian", "Filipino", "French", "Greek", "Indian", "Irish", "Italian", "Jamaican", "Japanese", "Kenyan", "Malaysian", 
        "Mexican", "Moroccan", "Norwegian", "Polish", "Portuguese", "Russian", "Saudi Arabian", "Slovakian", "Spanish", 
        "Syrian","Thai", "Tunisian", "Turkish", "Ukranian", "Uruguayan", "Venezuelan", "Unknown", "Vietnamese", "Other"
    ];

    const handleFormChange = <K extends keyof FormData>(
        key: K,
        value: FormData[K]
    ) => {
        setError(null);
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const instructionsString = formData.instructions
                .map((step) => `${step}`)
                .join('\n');

            const ingredientsToSend = ingredientFields
                .filter(field => field.name.trim() !== "")
                .map(field => ({
                    name: field.name.trim(),
                    measure: field.measure.trim(),
                }));

            let recipe = {
                name: formData.name.trim(),
                category: formData.category.trim(),
                area: formData.area.trim(),
                instructions: instructionsString,
                ingredients: ingredientsToSend,
                tags: formData.tags,
                thumbnail: formData.thumbnail.trim(),
            };

            let res = await axios.post('/api/recipes', recipe, { withCredentials: true });
            if (res.status !== 201) {
                throw new Error(res.data?.error ||  res.data?.errors);
            }

            setSuccessMessage("Recipe created successfully!");
            setTimeout(() => setSuccessMessage(null), 3500);
        } catch (err) {
            setSuccessMessage(null);
            if (axios.isAxiosError(err)) {
                if (err.response?.data?.errors) {
                    setError("Failed to create recipe: " + err.response.data.errors.join(", "));
                } else if (err.response?.data?.error) {
                    setError("Failed to create recipe: " + err.response.data.error);
                } else {
                    setError("Failed to create recipe: " + err.message);
                }
            } else if (err instanceof Error) {
                setError("Failed to create recipe: " + err.message);
            } else {
                setError("Failed to create recipe: Unknown error");
            }
        }
    };

    useEffect (() => {
        axios.get('/api/ingredient')
            .then(response => {
                setIngredients(response.data);
            })
            .catch(error => {
                console.error("Error fetching ingredients:", error);
            });
    }, []);

    const handleIngredientChange = (index: number, value: string | null) => {
        const updated = [...ingredientFields];
        updated[index].name = value || "";
        setIngredientFields(updated);
    };

    const handleMeasureChange = (index: number, value: string) => {
        const updated = [...ingredientFields];
        updated[index].measure = value;
        setIngredientFields(updated);
    };

    const handleAddIngredient = () => {
        if (ingredientFields.length < 20) {
            setIngredientFields([...ingredientFields, { name: "", measure: "" }]);
        }
    };

    const handleRemoveIngredient = (index: number) => {
        if (ingredientFields.length === 1) return;
        setIngredientFields(ingredientFields.filter((_, i) => i !== index));
    };

    const handleInstructionChange = (index: number, value: string) => {
        const updated = [...formData.instructions];
        updated[index] = value;
        handleFormChange("instructions", updated);
    };

    const handleAddInstruction = () => {
        if (formData.instructions.length < 20) {
            setFormData({ ...formData, instructions: [...formData.instructions, ""] });
        }
    };

    const handleRemoveInstruction = (index: number) => {
        if (formData.instructions.length === 1) return; 
        const updated = formData.instructions.filter((_, i) => i !== index);
        setFormData({ ...formData, instructions: updated });
    };

    return (
        <>
            {(successMessage || error) && (
                <div className="alert-container">
                    {successMessage ? (
                    <Alert severity="success">
                        {successMessage}
                    </Alert>
                    ) : (
                    <Alert severity="error">
                        {error}
                    </Alert>
                    )}
                </div>
            )}
            <Container>
                <Box sx={{ mt: 4, p: 3, boxShadow: 2, borderRadius: 2, backgroundColor: 'white', padding: 5, width: "30vw"}}>
                    <Typography variant="h4" sx={{ color: 'black' }}>
                        Create Recipe
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Recipe Name"
                            name="name"
                            value={formData.name}
                            onChange={(e) => handleFormChange("name", e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <Typography variant="h6" sx={{ color: 'black', textAlign: "left", mt: 1 }}>
                            Thumbnail Image
                        </Typography>
                        <TextField
                            label="Thumbnail Link"
                            name="thumbnail"
                            value={formData.thumbnail}
                            onChange={(e) => handleFormChange("thumbnail", e.target.value)}
                            fullWidth
                            margin="normal"
                            placeholder="Paste image URL"
                            required
                        />
                        <Autocomplete
                            multiple
                            freeSolo
                            options={tagOptions}
                            value={formData.tags}
                            onChange={(_e, value) => handleFormChange("tags", value)}
                            renderInput={(params) => (
                                <TextField {...params} label="Tags" margin="normal" fullWidth placeholder="Add tags" />
                            )}
                            renderOption={(props, option) => (
                                <li {...props} key={option}>
                                    {option}
                                </li>
                            )}
                            slotProps={{
                                chip: {
                                    sx: {
                                        background: '#e0e0e0',
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.5,
                                        mr: 1,
                                        mb: 1,
                                        '.MuiChip-label': { color: 'black', fontWeight: 500 }
                                    },
                                    deleteIcon: <CloseIcon fontSize="small" />
                                }
                            }}
                        />
                        <Autocomplete
                            freeSolo
                            options={categories}
                            value={formData.category}
                            onChange={(_e, value) => handleFormChange("category", value || "")}
                            renderInput={(params) => (
                                <TextField {...params} label="Category" margin="normal" required fullWidth />
                            )}
                        />
                        <Autocomplete
                            freeSolo
                            options={areas}
                            value={formData.area || ""}
                            onChange={(_e, value) => handleFormChange("area", value || "")}
                            renderInput={(params) => (
                                <TextField {...params} label="Area" margin="normal" required fullWidth />
                            )}
                        />
                        <Typography variant="h6" sx={{ my: 1, color: 'black', textAlign: "left" }}>
                            Ingredients
                        </Typography>
                        {ingredientFields.map((field, idx) => (
                            <Box key={idx} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <TextField
                                    label="Measure"
                                    value={field.measure}
                                    onChange={e => handleMeasureChange(idx, e.target.value)}
                                    sx={{ width: 120, mr: 1 }}
                                    size="medium"
                                />
                                <Autocomplete
                                    freeSolo

                                    options={ingredients.map(i => i.name)}
                                    value={field.name}
                                    onChange={(_e, v) => handleIngredientChange(idx, v)}
                                    renderInput={(params) => (
                                        <TextField {...params} label={`Ingredient ${idx + 1}`} fullWidth required/>
                                    )}
                                    sx={{ flex: 1 }}
                                />
                                <IconButton
                                    aria-label="delete"
                                    onClick={() => handleRemoveIngredient(idx)}
                                    sx={{ ml: 1 }}
                                    disabled={ingredientFields.length === 1}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={handleAddIngredient}
                            sx={{ my: 1 }}
                            disabled={ingredientFields.length >= 20}
                            fullWidth
                        >
                            Add Ingredient
                        </Button>
                        <Typography variant="h6" sx={{ my: 1, color: 'black', textAlign: "left" }}>
                            Instructions
                        </Typography>
                        {formData.instructions.map((step, idx) => (
                            <Box key={idx} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Typography variant="body1" sx={{ mr: 2, color: 'black' }}>
                                    {idx + 1}.
                                </Typography>
                                <TextField
                                    value={step}
                                    onChange={e => handleInstructionChange(idx, e.target.value)}
                                    label={`Step ${idx + 1}`}
                                    fullWidth
                                    multiline
                                    required
                                    minRows={1}
                                    sx={{ flex: 1 }}
                                />
                                <IconButton
                                    aria-label="delete"
                                    onClick={() => handleRemoveInstruction(idx)}
                                    sx={{ ml: 1 }}
                                    disabled={formData.instructions.length === 1}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={handleAddInstruction}
                            sx={{ my: 1 }}
                            fullWidth
                        >
                            Add Step
                        </Button>
                        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} fullWidth>
                            Create
                        </Button>
                    </form>
                </Box>
            </Container>
        </>
    );
}

export default CreateRecipe;