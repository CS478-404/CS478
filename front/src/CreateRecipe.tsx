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

function CreateRecipe() {
    interface FormData {
        name: string;
        category: string;
        area: string;
        instructions: string[];
    }

    const [formData, setFormData] = useState<FormData>({
        name: "",
        category: "",
        area: "",
        instructions: [""],
    });
    const [error, setError] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<{ id: number; name: string }[]>([]);
    const [ingredientFields, setIngredientFields] = useState<{ name: string; measure: string }[]>([
        { name: "", measure: "" }
    ]);

    const categories = [
        "Beef", "Chicken", "Dessert", "Lamb", "Miscellaneous", "Pasta", "Pork", "Seafood", 
        "Side", "Starter", "Vegan", "Vegetarian", "Breakfast", "Goat", "Other"
    ];

    const areas = [
        "Algerian", "American", "Argentinian", "Australian", "British", "Canadian", "Chinese", "Croatian", "Dutch", 
        "Egyptian", "Filipino", "French", "Greek", "Indian", "Irish", "Italian", "Jamaican", "Japanese", "Kenyan", "Malaysian", 
        "Mexican", "Moroccan", "Norwegian", "Polish", "Portuguese", "Russian", "Saudi Arabian", "Slovakian", "Spanish", 
        "Syrian","Thai", "Tunisian", "Turkish", "Ukranian", "Uruguayan", "Venezuelan", "Unknown", "Vietnamese", "Other"
    ]

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setError(null);
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    };

    const handleCategoryChange = (_event: React.SyntheticEvent, value: string | null) => {
        setFormData({
            ...formData,
            category: value || "",
        });
    };

    const handleAreaChange = (_event: React.SyntheticEvent, value: string | null) => {
        setFormData({
            ...formData,
            area: value || "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);

            const instructionsString = formData.instructions
                .map((step, idx) => `Step ${idx + 1}: ${step}`)
                .join('\n');

            const ingredientsToSend = ingredientFields
                .filter(field => field.name.trim() !== "")
                .map(field => ({
                    name: field.name.trim(),
                    measure: field.measure.trim(),
                }));

            const recipe = {
                name: formData.name.trim(),
                category: formData.category.trim(),
                area: formData.area.trim(),
                instructions: instructionsString,
                ingredients: ingredientsToSend,
            };
            await axios.post('/api/recipes', recipe);

            alert(`Recipe "${formData.name}" created!`);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError("Failed to create recipe: " + (err.response?.data?.error || err.message));
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
        setFormData({ ...formData, instructions: updated });
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
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <Autocomplete
                        freeSolo
                        options={categories}
                        value={formData.category}
                        onChange={handleCategoryChange}
                        renderInput={(params) => (
                            <TextField {...params} label="Category" margin="normal" required fullWidth />
                        )}
                    />
                    <Autocomplete
                        freeSolo
                        options={areas}
                        value={formData.area || ""}
                        onChange={handleAreaChange}
                        renderInput={(params) => (
                            <TextField {...params} label="Area" margin="normal" required fullWidth />
                        )}
                    />
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
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
                                    <TextField {...params} label={`Ingredient ${idx + 1}`} fullWidth />
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
    );
}

export default CreateRecipe;