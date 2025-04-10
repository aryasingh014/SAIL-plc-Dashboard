
import { supabase } from "@/integrations/supabase/client";
import { Parameter } from "@/types/parameter";
import { toast } from "sonner";

export interface ParameterData {
  id?: string;
  name: string;
  value: number;
  unit: string;
  min_value: number | null;
  max_value: number | null;
  status?: string;
  user_id?: string; // Adding user_id field to match expected structure
}

export async function fetchParameters() {
  try {
    const { data, error } = await supabase
      .from('parameters')
      .select('*');
    
    if (error) {
      console.error('Error fetching parameters:', error);
      throw error;
    }

    console.log('Fetched parameters:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchParameters:', error);
    return [];
  }
}

export async function createParameter(parameter: ParameterData) {
  try {
    // Add user_id if not present
    if (!parameter.user_id) {
      const { data: { user } } = await supabase.auth.getUser();
      parameter.user_id = user?.id;
    }

    const { data, error } = await supabase
      .from('parameters')
      .insert(parameter) // Now passing a single object instead of an array
      .select();
    
    if (error) {
      console.error('Error creating parameter:', error);
      toast.error('Failed to create parameter: ' + error.message);
      throw error;
    }

    toast.success('Parameter created successfully');
    return data?.[0];
  } catch (error) {
    console.error('Error in createParameter:', error);
    return null;
  }
}

export async function updateParameter(id: string, parameter: Partial<ParameterData>) {
  try {
    const { data, error } = await supabase
      .from('parameters')
      .update(parameter)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating parameter:', error);
      toast.error('Failed to update parameter: ' + error.message);
      throw error;
    }

    toast.success('Parameter updated successfully');
    return data?.[0];
  } catch (error) {
    console.error('Error in updateParameter:', error);
    return null;
  }
}

export async function deleteParameter(id: string) {
  try {
    const { error } = await supabase
      .from('parameters')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting parameter:', error);
      toast.error('Failed to delete parameter: ' + error.message);
      throw error;
    }

    toast.success('Parameter deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteParameter:', error);
    return false;
  }
}

export function convertToParameter(data: any): Parameter {
  return {
    id: data.id,
    name: data.name,
    description: `${data.name} parameter`,
    unit: data.unit || '',
    value: data.value,
    status: data.status || 'normal',
    thresholds: {
      warning: {
        min: data.min_value || null,
        max: data.max_value || null
      },
      alarm: {
        min: data.min_value ? data.min_value * 0.9 : null,
        max: data.max_value ? data.max_value * 1.1 : null
      }
    },
    timestamp: data.updated_at || new Date().toISOString(),
    category: 'Custom'
  };
}
