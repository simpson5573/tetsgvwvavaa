"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCompanyStore } from "@/lib/company-store"
import { Button } from "@/components/ui/button"
import { Edit, Plus, Trash2, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import MultiContactInput from "@/components/multi-contact-input"
import { formatPhoneNumber } from "@/lib/phone-formatter"

export default function CompaniesPage() {
  const { companies, setDefaultCompany, updateCompany, deleteCompany, addCompany, loadCompanies, loading, error } =
    useCompanyStore()
  const [editingCompany, setEditingCompany] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const [editForm, setEditForm] = useState({
    id: 0,
    name: "",
    contact: [""],
    phone: [""],
    price: 0,
    notes: "",
    productName: "",
    pin: "",
    plant: "all",
  })

  const [addForm, setAddForm] = useState({
    name: "",
    contact: [""],
    phone: [""],
    price: 0,
    notes: "",
    productName: "유동사",
    pin: "",
    plant: "all",
  })

  // 시설별 품명 옵션 생성 (순서 변경)
  const productOptions = ["유동사", "고령토", "요소수", "황산암모늄", "소석회", "중탄산나트륨"]

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  // 에러 처리
  useEffect(() => {
    if (error) {
      toast({
        title: "오류 발생",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleSetDefault = async (id: number, productName: string) => {
    try {
      console.log(`[Client] Setting default company: ID=${id}, Product=${productName}`)

      // 로딩 상태 표시
      toast({
        title: "처리 중...",
        description: "기본 업체를 설정하는 중입니다.",
      })

      const result = await setDefaultCompany(id, productName)
      console.log(`[Client] Server action result:`, result)

      if (result) {
        // 성공 시 데이터 다시 로드
        await loadCompanies()

        toast({
          title: "기본 업체 설정 완료",
          description: "기본 업체가 성공적으로 설정되었습니다.",
        })
      } else {
        toast({
          title: "오류 발생",
          description: "기본 업체 설정에 실패했습니다. 콘솔을 확인하세요.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Client] Error setting default company:", error)
      toast({
        title: "오류 발생",
        description: `기본 업체 설정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (company: (typeof companies)[0]) => {
    setEditForm({
      id: company.id,
      name: company.name,
      contact: company.contact.length > 0 ? company.contact : [""],
      phone: company.phone.length > 0 ? company.phone : [""],
      price: company.price,
      notes: company.notes,
      productName: company.productName,
      pin: company.pin || "",
      plant: company.plant || "all",
    })
    setEditingCompany(company.id)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      // 전화번호 포맷팅 적용
      const formattedPhone = editForm.phone.map((phone) => formatPhoneNumber(phone))

      await updateCompany(editForm.id, {
        name: editForm.name,
        contact: editForm.contact,
        phone: formattedPhone,
        price: editForm.price,
        notes: editForm.notes,
        pin: editForm.pin,
        plant: editForm.plant,
      })
      setIsEditDialogOpen(false)
      toast({
        title: "업체 정보 수정 완료",
        description: "업체 정보가 성공적으로 수정되었습니다.",
      })
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "업체 정보 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCompany = async () => {
    if (!editingCompany) return

    try {
      await deleteCompany(editingCompany)
      setIsEditDialogOpen(false)
      toast({
        title: "업체 삭제 완료",
        description: "업체가 성공적으로 삭제되었습니다.",
      })
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "업체 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // handleAddCompany 함수 수정
  const handleAddCompany = async () => {
    // 필수 필드 검증
    if (!addForm.name) {
      toast({
        title: "입력 오류",
        description: "업체명은 필수 입력 항목입니다.",
        variant: "destructive",
      })
      return
    }

    try {
      // 전화번호 포맷팅 적용
      const formattedPhone = addForm.phone.map((phone) => formatPhoneNumber(phone))

      await addCompany({
        name: addForm.name,
        contact: addForm.contact,
        phone: formattedPhone,
        price: addForm.price,
        notes: addForm.notes,
        productName: addForm.productName,
        pin: addForm.pin,
        plant: addForm.plant,
      })
      setIsAddDialogOpen(false)
      setAddForm({
        name: "",
        contact: [""],
        phone: [""],
        price: 0,
        notes: "",
        productName: "유동사",
        pin: "",
        plant: "all",
      })
      toast({
        title: "업체 추가 완료",
        description: "새 업체가 성공적으로 추가되었습니다.",
      })
    } catch (error) {
      console.error("업체 추가 중 오류:", error)
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "업체 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 정렬된 회사 목록 생성
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      const aIndex = productOptions.indexOf(a.productName)
      const bIndex = productOptions.indexOf(b.productName)
      return aIndex - bIndex
    })
  }, [companies, productOptions])

  return (
    <div className="container py-6">
      <Card className="w-full shadow-sm border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-gray-800">업체 관리</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-center font-semibold text-gray-700">PIN</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Plant</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">품명</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">업체명</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">담당자</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">연락처</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">단가 (원/ton)</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">비고</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">기본 업체</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company, index) => (
                <TableRow key={company.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="text-center font-medium text-blue-600">{company.pin || "-"}</TableCell>
                  <TableCell className="text-center font-medium text-purple-600">{company.plant || "all"}</TableCell>
                  <TableCell className="text-center">{company.productName}</TableCell>
                  <TableCell className="text-center font-medium">{company.name}</TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      {company.contact
                        .filter((c) => c.trim())
                        .map((contact, idx) => (
                          <div key={idx}>{contact}</div>
                        ))}
                      {company.contact.filter((c) => c.trim()).length === 0 && "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      {company.phone
                        .filter((p) => p.trim())
                        .map((phone, idx) => (
                          <div key={idx}>{phone}</div>
                        ))}
                      {company.phone.filter((p) => p.trim()).length === 0 && "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{company.price.toLocaleString()}원</TableCell>
                  <TableCell className="text-center">{company.notes}</TableCell>
                  <TableCell className="text-center">
                    {company.isDefault ? (
                      <div className="flex items-center justify-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="font-medium">기본 업체</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-gray-400">
                        <span className="text-lg font-medium">-</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(company)}
                      className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 업체 정보 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>업체 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN (업체 페이지 로그인 번호)</Label>
              <Input
                id="pin"
                value={editForm.pin}
                onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
                placeholder="PIN 입력"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plant">Plant</Label>
              <Select
                value={editForm.plant || "all"}
                onValueChange={(value) => setEditForm({ ...editForm, plant: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Plant 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="bio1">Bio1</SelectItem>
                  <SelectItem value="bio2">Bio2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">품명</Label>
              <Input id="product-name" value={editForm.productName} disabled className="bg-gray-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name">업체명</Label>
              <Input
                id="company-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <MultiContactInput
              label="담당자"
              values={editForm.contact}
              onChange={(values) => setEditForm({ ...editForm, contact: values })}
              placeholder="담당자명 입력"
            />
            <MultiContactInput
              label="연락처"
              values={editForm.phone}
              onChange={(values) => setEditForm({ ...editForm, phone: values })}
              placeholder="연락처 입력"
              isPhone={true}
            />
            <div className="space-y-2">
              <Label htmlFor="price">단가 (원/ton)</Label>
              <Input
                id="price"
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">비고</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>업체 삭제 확인</AlertDialogTitle>
                  <AlertDialogDescription>
                    정말로 이 업체를 삭제하시겠습니까?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteCompany} className="bg-red-600 hover:bg-red-700">
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 업체 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 업체 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-pin">PIN</Label>
              <Input
                id="add-pin"
                value={addForm.pin}
                onChange={(e) => setAddForm({ ...addForm, pin: e.target.value })}
                placeholder="PIN 입력"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-plant">Plant</Label>
              <Select value={addForm.plant} onValueChange={(value) => setAddForm({ ...addForm, plant: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Plant 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="bio1">Bio1</SelectItem>
                  <SelectItem value="bio2">Bio2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-company-name">업체명</Label>
              <Input
                id="add-company-name"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-product-name">품명</Label>
              <Select
                value={addForm.productName}
                onValueChange={(value) => setAddForm({ ...addForm, productName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="품명 선택" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((product) => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <MultiContactInput
              label="담당자"
              values={addForm.contact}
              onChange={(values) => setAddForm({ ...addForm, contact: values })}
              placeholder="담당자명 입력"
            />
            <MultiContactInput
              label="연락처"
              values={addForm.phone}
              onChange={(values) => setAddForm({ ...addForm, phone: values })}
              placeholder="연락처 입력"
              isPhone={true}
            />
            <div className="space-y-2">
              <Label htmlFor="add-price">단가 (원/ton)</Label>
              <Input
                id="add-price"
                type="number"
                value={addForm.price}
                onChange={(e) => setAddForm({ ...addForm, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">비고</Label>
              <Textarea
                id="add-notes"
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleAddCompany}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading || !addForm.name}
            >
              {loading ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
