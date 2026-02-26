import { useState } from "react";
import { TextField, Button, Container, Typography, Box, MenuItem } from "@mui/material";

function CreateRecipe() {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        instructions: "",
    });
    const [error, setError] = useState<string | null>(null);

    const categories = [
        "Beef", "Chicken", "Dessert", "Lamb", "Miscellaneous", "Pasta", "Pork", "Seafood", 
        "Side", "Starter", "Vegan", "Vegetarian", "Breakfast", "Goat", "Other"
    ];

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setError(null);
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    };

    const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            category: event.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            // await axios.post('/api/recipes', formData);
            alert(`Recipe "${formData.name}" created!`);
        } catch (err) {
            setError("Failed to create recipe: " + (err as Error).message);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4, p: 3, boxShadow: 2, borderRadius: 2, backgroundColor: 'white'}}>
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
                    <TextField
                        select
                        label="Category"
                        name="category"
                        value={formData.category}
                        onChange={handleCategoryChange}
                        fullWidth
                        margin="normal"
                        required
                        sx ={{ textAlign: 'left' }}
                    >
                        {categories.map((category) => (
                            <MenuItem key={category} value={category}>
                                {category}
                            </MenuItem>
                        ))}
                    </TextField>
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                        Create
                    </Button>
                </form>
            </Box>
        </Container>
    );
}

export default CreateRecipe;