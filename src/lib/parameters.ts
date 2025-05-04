import { supabase } from "@/integrations/supabase/client";
import { Parameter, ParameterHistoryRecord, ParameterStatus } from "@/types/parameter";
import { toast } from "sonner";

export interface ParameterData {
  id?: string;
  name: string;
  value: number;
  unit: string;
  min_value: number | null;
  max_value: number | null;
  status?: ParameterStatus;
  user_id?: string;
}

export async function fetchParameters() {
  try {
    const { data, error } = await supabase
      .from('parameters')
      .select('*')
      .is('user_id', null)
      .or('user_id.not.is.null');
    
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

export async function fetchParameterHistory(parameterId: string) {
  try {
    // Use the parameters table with the user_id field to identify history records
    const { data, error } = await supabase
      .from('parameters')
      .select('*')
      .eq('user_id', parameterId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching parameter history:', error);
      throw error;
    }

    // Transform the data to match the expected format
    const historyData = data.map(record => ({
      parameter_id: record.user_id,
      value: record.value,
      status: record.status as ParameterStatus,
      timestamp: record.created_at || new Date().toISOString()
    }));

    return historyData || [];
  } catch (error) {
    console.error('Error in fetchParameterHistory:', error);
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

    // Create a new object to ensure all required fields are present
    const parameterToInsert = {
      name: parameter.name,
      value: parameter.value,
      unit: parameter.unit || '',
      min_value: parameter.min_value,
      max_value: parameter.max_value,
      status: parameter.status || 'normal',
      user_id: parameter.user_id
    };

    const { data, error } = await supabase
      .from('parameters')
      .insert(parameterToInsert)
      .select();
    
    if (error) {
      console.error('Error creating parameter:', error);
      toast("Failed to create parameter", {
        description: error.message
      });
      throw error;
    }

    toast("Parameter created successfully");
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
      toast("Failed to update parameter", {
        description: error.message
      });
      throw error;
    }

    toast("Parameter updated successfully");
    return data?.[0];
  } catch (error) {
    console.error('Error in updateParameter:', error);
    return null;
  }
}

export async function deleteParameter(id: string) {
  try {
    // First delete any history entries for this parameter
    const { error: historyError } = await supabase
      .from('parameters')
      .delete()
      .eq('user_id', id);
    
    if (historyError) {
      console.error('Error deleting parameter history:', historyError);
    }
    
    // Then delete the parameter itself
    const { error } = await supabase
      .from('parameters')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting parameter:', error);
      toast("Failed to delete parameter", {
        description: error.message
      });
      throw error;
    }

    toast("Parameter deleted successfully");
    return true;
  } catch (error) {
    console.error('Error in deleteParameter:', error);
    toast("Failed to delete parameter");
    return false;
  }
}

export async function addParameterHistoryEntry(record: ParameterHistoryRecord) {
  try {
    // Store history as a parameter record with user_id field containing the original parameter id
    const { error } = await supabase
      .from('parameters')
      .insert({
        name: `history_${record.parameter_id}`, 
        value: record.value,
        status: record.status,
        unit: '', // Placeholder value
        user_id: record.parameter_id, // Using user_id to reference the original parameter
        created_at: record.timestamp
      });
    
    if (error) {
      console.error('Error adding parameter history entry:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in addParameterHistoryEntry:', error);
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
    status: (data.status as ParameterStatus) || 'normal',
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
    category: 'SAIL Data'
  };
}
