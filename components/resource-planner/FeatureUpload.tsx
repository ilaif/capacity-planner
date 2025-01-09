import { Input } from '@/components/ui/input';
import { ParseResult } from 'papaparse';
import Papa from 'papaparse';
import { Feature, FeatureCSV } from '@/types/resource-planner';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FeatureUploadProps {
  onFeaturesUploaded: (features: Feature[]) => void;
}

export function FeatureUpload({ onFeaturesUploaded }: FeatureUploadProps) {
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<FeatureCSV>) => {
          const newFeatures = results.data.map((row, index) => ({
            id: index + 1,
            name: row.feature || `Feature ${index + 1}`,
            requirements: {
              provider: {
                weeks: parseInt(row.provider_weeks) || 0,
                parallel: parseInt(row.provider_parallel) || 1,
              },
              platform: {
                weeks: parseInt(row.platform_weeks) || 0,
                parallel: parseInt(row.platform_parallel) || 1,
              },
            },
          }));
          onFeaturesUploaded(newFeatures);
        },
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-sm font-medium whitespace-nowrap">Upload CSV</h3>
        <Input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>
      <button
        onClick={() => setIsRequirementsOpen(!isRequirementsOpen)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
      >
        {isRequirementsOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        CSV Format Requirements
      </button>

      {isRequirementsOpen && (
        <div className="space-y-2 text-sm text-gray-500 pl-6">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="text-left pr-4">Column</th>
                <th className="text-left pr-4">Type</th>
                <th className="text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-4">feature</td>
                <td className="pr-4">text</td>
                <td>Feature name (e.g., &quot;Login System&quot;)</td>
              </tr>
              <tr>
                <td className="pr-4">provider_weeks</td>
                <td className="pr-4">number</td>
                <td>Number of weeks needed by provider team (e.g., 3)</td>
              </tr>
              <tr>
                <td className="pr-4">provider_parallel</td>
                <td className="pr-4">number</td>
                <td>Number of provider engineers that can work in parallel (e.g., 2)</td>
              </tr>
              <tr>
                <td className="pr-4">platform_weeks</td>
                <td className="pr-4">number</td>
                <td>Number of weeks needed by platform team (e.g., 2)</td>
              </tr>
              <tr>
                <td className="pr-4">platform_parallel</td>
                <td className="pr-4">number</td>
                <td>Number of platform engineers that can work in parallel (e.g., 1)</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2">Example row:</p>
          <code className="block bg-gray-100 p-2 rounded">Login System,3,2,2,1</code>
        </div>
      )}
    </div>
  );
}
