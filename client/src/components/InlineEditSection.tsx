import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit2, Save, X } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface InlineEditSectionProps {
  title: string;
  children: React.ReactNode;
  editComponent?: React.ReactNode;
  onSave?: (value: any) => void;
  canEdit?: boolean;
  modulePermission?: string;
  icon?: React.ReactNode;
}

export function InlineEditSection({ 
  title, 
  children, 
  editComponent, 
  onSave, 
  canEdit = true,
  modulePermission,
  icon 
}: InlineEditSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { hasPermission } = usePermissions();

  const hasWritePermission = modulePermission ? hasPermission(modulePermission, 'write') : true;
  const canEditSection = canEdit && hasWritePermission;

  const handleSave = (value: any) => {
    onSave?.(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="font-medium">{title}</Label>
        </div>
        {canEditSection && !isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleSave(null)} // Value will be handled by the edit component
              className="h-6 px-2 text-xs"
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="pl-6">
        {isEditing ? editComponent : children}
      </div>
    </div>
  );
}

interface EditableFieldProps {
  value: string | boolean | string[];
  type?: 'text' | 'textarea' | 'select' | 'switch' | 'multiselect';
  options?: Array<{ value: string; label: string }>;
  onSave: (value: any) => void;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
}

export function EditableField({ 
  value, 
  type = 'text', 
  options = [], 
  onSave, 
  onCancel, 
  placeholder,
  className 
}: EditableFieldProps) {
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    onSave(currentValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  switch (type) {
    case 'textarea':
      return (
        <div className="space-y-2">
          <Textarea
            value={currentValue as string}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" />
              Sauvegarder
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Select 
            value={currentValue as string} 
            onValueChange={setCurrentValue}
          >
            <SelectTrigger className={className}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" />
              Sauvegarder
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
          </div>
        </div>
      );

    case 'switch':
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentValue as boolean}
              onCheckedChange={setCurrentValue}
            />
            <Label>{currentValue ? 'Oui' : 'Non'}</Label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" />
              Sauvegarder
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
          </div>
        </div>
      );

    default:
      return (
        <Input
          value={currentValue as string}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className={className}
          autoFocus
        />
      );
  }
}