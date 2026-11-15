import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Grid
} from '@mui/material';
import useFlavourStore from '../store/flavourStore';

export default function FlavourForm({ editingId, onClose }) {
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { addFlavour, updateFlavour, flavours } = useFlavourStore();

  useEffect(() => {
    if (editingId) {
      const flavour = flavours.find((f) => f._id === editingId);
      if (flavour) {
        setFormData({
          name: flavour.name,
          price: String(flavour.price),
          description: flavour.description || ''
        });
      }
    } else {
      setFormData({ name: '', price: '', description: '' });
    }
  }, [editingId, flavours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim()
      };

      if (!submitData.name || isNaN(submitData.price)) {
        setError('Name and a valid price are required');
        setIsSubmitting(false);
        return;
      }

      if (editingId) {
        await updateFlavour(editingId, submitData);
      } else {
        await addFlavour(submitData);
      }
      setFormData({ name: '', price: '', description: '' });
      if (onClose) onClose();
    } catch (err) {
      console.error('Error saving flavour:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save flavour');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: 2, mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {editingId ? 'Edit Flavour' : 'Add New Flavour'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Flavour Name *"
                placeholder="e.g. Orange Juice"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Price *"
                placeholder="e.g. 250"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                required
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description (Optional)"
            placeholder="Describe the flavour..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 3 }}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onClose && (
              <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingId ? 'Update Flavour' : 'Add Flavour'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
